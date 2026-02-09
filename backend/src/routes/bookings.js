import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['CUSTOMER']));

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({ error: { code, message } });
}

function toBookingDto(booking) {
  const b = booking;
  return {
    id: b.id,
    customerId: b.customerId,
    status: b.status,
    scheduledAt: b.scheduledAt.toISOString(),
    address: b.address,
    totalPriceCents: b.totalPriceCents,
    stripePaymentIntentId: b.stripePaymentIntentId ?? null,
    clientSecret: b.clientSecret ?? undefined,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    items: (b.items || []).map((i) => ({
      id: i.id,
      serviceId: i.serviceId,
      serviceName: i.service?.name,
      quantity: i.quantity,
      priceCents: i.priceCents,
    })),
    job: b.job
      ? {
          id: b.job.id,
          status: b.job.status,
          providerId: b.job.providerId,
          assignedEmployeeId: b.job.assignedEmployeeId ?? null,
        }
      : null,
  };
}

// GET /api/v1/bookings
router.get('/', async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { customerId: req.userId },
    orderBy: { scheduledAt: 'desc' },
    include: {
      items: { include: { service: true } },
      job: true,
    },
  });
  return res.json(bookings.map(toBookingDto));
});

// GET /api/v1/bookings/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: req.userId },
    include: {
      items: { include: { service: true } },
      job: { include: { provider: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!booking) {
    return errorResponse(res, 'NOT_FOUND', 'Booking not found', 404);
  }
  const dto = toBookingDto(booking);
  if (booking.job?.provider) {
    dto.provider = booking.job.provider;
  }
  return res.json(dto);
});

// POST /api/v1/bookings - create booking + payment intent
router.post('/', async (req, res) => {
  const { scheduledAt, address, items: itemsInput } = req.body ?? {};

  if (!address || typeof address !== 'string' || !address.trim()) {
    return errorResponse(res, 'VALIDATION_ERROR', 'address is required');
  }
  const scheduled = scheduledAt ? new Date(scheduledAt) : null;
  if (!scheduled || Number.isNaN(scheduled.getTime())) {
    return errorResponse(res, 'VALIDATION_ERROR', 'scheduledAt must be a valid ISO date');
  }
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    return errorResponse(res, 'VALIDATION_ERROR', 'items array with at least one service is required');
  }

  const serviceIds = [...new Set(itemsInput.map((i) => i.serviceId).filter(Boolean))];
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, active: true },
  });
  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));

  let totalPriceCents = 0;
  const bookingItems = [];
  for (const item of itemsInput) {
    const serviceId = item.serviceId;
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const service = serviceMap[serviceId];
    if (!service) {
      return errorResponse(res, 'VALIDATION_ERROR', `Unknown or inactive service: ${serviceId}`);
    }
    const priceCents = service.basePriceCents * quantity;
    totalPriceCents += priceCents;
    bookingItems.push({ serviceId, quantity, priceCents, service });
  }

  let stripePaymentIntentId = null;
  let stripeClientSecret = null;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalPriceCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { customerId: req.userId },
      });
      stripePaymentIntentId = paymentIntent.id;
      stripeClientSecret = paymentIntent.client_secret;
    } catch (err) {
      console.error('Stripe PaymentIntent create error:', err.message);
    }
  }

  const booking = await prisma.booking.create({
    data: {
      customerId: req.userId,
      status: 'PENDING',
      scheduledAt: scheduled,
      address: address.trim(),
      totalPriceCents,
      stripePaymentIntentId,
      items: {
        create: bookingItems.map(({ serviceId, quantity, priceCents }) => ({
          serviceId,
          quantity,
          priceCents,
        })),
      },
    },
    include: {
      items: { include: { service: true } },
      job: true,
    },
  });

  const dto = toBookingDto(booking);
  dto.clientSecret = stripeClientSecret ?? undefined;
  return res.status(201).json(dto);
});

// POST /api/v1/bookings/:id/confirm-payment - after client confirms with Stripe SDK
router.post('/:id/confirm-payment', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: req.userId },
    include: { items: { include: { service: true } }, job: true },
  });
  if (!booking) {
    return errorResponse(res, 'NOT_FOUND', 'Booking not found', 404);
  }
  if (booking.status !== 'PENDING') {
    return res.json(toBookingDto(booking));
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && booking.stripePaymentIntentId) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey);
      const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
      if (pi.status === 'succeeded') {
        const updated = await prisma.booking.update({
          where: { id },
          data: { status: 'CONFIRMED' },
          include: { items: { include: { service: true } }, job: true },
        });
        return res.json(toBookingDto(updated));
      }
    } catch (err) {
      console.error('Stripe retrieve error:', err.message);
    }
  }
  return res.json(toBookingDto(booking));
});

// PATCH /api/v1/bookings/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: req.userId },
    include: { job: true },
  });
  if (!booking) {
    return errorResponse(res, 'NOT_FOUND', 'Booking not found', 404);
  }
  if (booking.status === 'CANCELLED') {
    return res.json(toBookingDto(booking));
  }
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Booking cannot be cancelled in current status', 400);
  }
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { items: { include: { service: true } }, job: true },
  });
  return res.json(toBookingDto(updated));
});

export default router;
