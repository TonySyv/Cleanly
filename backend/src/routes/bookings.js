import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { getPaymentProvider } from '../lib/payment/index.js';
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
    addressId: b.addressId ?? null,
    customerNotes: b.customerNotes ?? null,
    totalPriceCents: b.totalPriceCents,
    stripePaymentIntentId: b.stripePaymentIntentId ?? null,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
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
          companyId: b.job.companyId ?? null,
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

// Format Address model to single display string
function formatAddressString(addr) {
  const parts = [addr.line1];
  if (addr.line2?.trim()) parts.push(addr.line2.trim());
  if (addr.city?.trim()) parts.push(addr.city.trim());
  if (addr.postalCode?.trim()) parts.push(addr.postalCode.trim());
  if (addr.country?.trim()) parts.push(addr.country.trim());
  return parts.join(', ');
}

const IDEMPOTENCY_EXPIRY_HOURS = 24;

// POST /api/v1/bookings - create booking + payment intent (idempotent when Idempotency-Key header is sent)
router.post('/', async (req, res) => {
  const idempotencyKeyRaw = req.headers['idempotency-key'];
  const idempotencyKey = typeof idempotencyKeyRaw === 'string' ? idempotencyKeyRaw.trim() : null;

  if (idempotencyKey) {
    const now = new Date();
    const cached = await prisma.idempotencyKey.findFirst({
      where: {
        key: idempotencyKey,
        resourceType: 'booking',
        expiresAt: { gt: now },
      },
    });
    if (cached) {
      const booking = await prisma.booking.findFirst({
        where: { id: cached.resourceId, customerId: req.userId },
        include: {
          items: { include: { service: true } },
          job: true,
        },
      });
      if (booking) {
        const dto = toBookingDto(booking);
        return res.status(200).json(dto);
      }
      return errorResponse(res, 'CONFLICT', 'Idempotency key already used for another user', 409);
    }
  }

  const {
    scheduledAt,
    address,
    addressId,
    addressLine1,
    addressLine2,
    city,
    postalCode,
    country,
    customerNotes,
    items: itemsInput,
  } = req.body ?? {};

  const scheduled = scheduledAt ? new Date(scheduledAt) : null;
  if (!scheduled || Number.isNaN(scheduled.getTime())) {
    return errorResponse(res, 'VALIDATION_ERROR', 'scheduledAt must be a valid ISO date');
  }
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    return errorResponse(res, 'VALIDATION_ERROR', 'items array with at least one service is required');
  }

  let resolvedAddress = null;
  let resolvedAddressId = null;

  if (addressId && typeof addressId === 'string' && addressId.trim()) {
    const addr = await prisma.address.findFirst({
      where: { id: addressId.trim(), userId: req.userId },
    });
    if (!addr) {
      return errorResponse(res, 'VALIDATION_ERROR', 'addressId not found or not owned by you');
    }
    resolvedAddress = formatAddressString(addr);
    resolvedAddressId = addr.id;
  } else if (addressLine1 && typeof addressLine1 === 'string' && addressLine1.trim()) {
    const parts = [addressLine1.trim()];
    if (addressLine2?.trim()) parts.push(addressLine2.trim());
    if (city?.trim()) parts.push(city.trim());
    if (postalCode?.trim()) parts.push(postalCode.trim());
    if (country?.trim()) parts.push(country.trim());
    resolvedAddress = parts.join(', ');
  } else if (address && typeof address === 'string' && address.trim()) {
    resolvedAddress = address.trim();
  }

  if (!resolvedAddress) {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      'Provide address (string), addressId (saved address), or addressLine1 (with optional city, postalCode, country)'
    );
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

  const payment = await getPaymentProvider();
  const { paymentIntentId: stripePaymentIntentId, clientSecret: stripeClientSecret } =
    await payment.createPaymentIntent(totalPriceCents, 'usd', { customerId: req.userId });

  const booking = await prisma.booking.create({
    data: {
      customerId: req.userId,
      status: 'PENDING',
      scheduledAt: scheduled,
      address: resolvedAddress,
      addressId: resolvedAddressId,
      customerNotes: typeof customerNotes === 'string' ? customerNotes.trim() || null : null,
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

  if (idempotencyKey) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_EXPIRY_HOURS);
    try {
      await prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          resourceType: 'booking',
          resourceId: booking.id,
          expiresAt,
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        const cached = await prisma.idempotencyKey.findFirst({
          where: { key: idempotencyKey, resourceType: 'booking', expiresAt: { gt: new Date() } },
        });
        if (cached) {
          const existing = await prisma.booking.findFirst({
            where: { id: cached.resourceId, customerId: req.userId },
            include: { items: { include: { service: true } }, job: true },
          });
          if (existing) return res.status(200).json(toBookingDto(existing));
        }
      }
      throw err;
    }
  }

  const dto = toBookingDto(booking);
  dto.clientSecret = stripeClientSecret ?? undefined;
  return res.status(201).json(dto);
});

// POST /api/v1/bookings/:id/confirm-payment - after client confirms (Stripe SDK or dummy "Confirm booking")
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
  const payment = await getPaymentProvider();
  const succeeded = await Promise.resolve(payment.isPaymentSucceeded(booking));
  if (succeeded) {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { items: { include: { service: true } }, job: true },
    });
    return res.json(toBookingDto(updated));
  }
  return res.json(toBookingDto(booking));
});

// PATCH /api/v1/bookings/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: req.userId },
    include: { items: { include: { service: true } }, job: true },
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
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: { items: { include: { service: true } }, job: true },
  });
  return res.json(toBookingDto(updated));
});

export default router;
