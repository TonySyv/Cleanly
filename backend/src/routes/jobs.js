import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Job pickup: same API for individual providers and companies (provider/company parity; see BOOKING_PLATFORM_PLAN § 0).
router.use(requireAuth);
router.use(requireRole(['PROVIDER', 'COMPANY']));

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({ error: { code, message } });
}

function toJobDto(job) {
  const j = job;
  return {
    id: j.id,
    bookingId: j.bookingId,
    providerId: j.providerId,
    companyId: j.companyId ?? null,
    assignedEmployeeId: j.assignedEmployeeId ?? null,
    status: j.status,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    booking: j.booking
      ? {
          id: j.booking.id,
          status: j.booking.status,
          scheduledAt: j.booking.scheduledAt.toISOString(),
          address: j.booking.address,
          totalPriceCents: j.booking.totalPriceCents,
          customer: j.booking.customer
            ? {
                id: j.booking.customer.id,
                name: j.booking.customer.name,
                email: j.booking.customer.email,
              }
            : null,
          items: (j.booking.items || []).map((i) => ({
            serviceName: i.service?.name,
            quantity: i.quantity,
            priceCents: i.priceCents,
          })),
        }
      : null,
  };
}

// GET /api/v1/jobs - list jobs for this provider or company
router.get('/', async (req, res) => {
  const userId = req.userId;
  const role = req.role;
  const where =
    role === 'COMPANY'
      ? await (async () => {
          const company = await prisma.company.findUnique({ where: { ownerId: userId } });
          if (!company) return { providerId: userId };
          return { OR: [{ providerId: userId }, { companyId: company.id }] };
        })()
      : { providerId: userId };
  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      booking: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { service: true } },
        },
      },
    },
  });
  return res.json(jobs.map(toJobDto));
});

// POST /api/v1/jobs - pick up a booking
router.post('/', async (req, res) => {
  const { bookingId } = req.body ?? {};
  if (!bookingId) {
    return errorResponse(res, 'VALIDATION_ERROR', 'bookingId is required');
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { job: true },
  });
  if (!booking) {
    return errorResponse(res, 'NOT_FOUND', 'Booking not found', 404);
  }
  if (booking.job) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Booking already has a job', 409);
  }
  if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
    return errorResponse(res, 'VALIDATION_ERROR', 'Booking cannot be picked up', 400);
  }
  const data = {
    bookingId: booking.id,
    providerId: req.userId,
    status: 'PENDING',
  };
  if (req.role === 'COMPANY') {
    const company = await prisma.company.findUnique({ where: { ownerId: req.userId } });
    if (company) data.companyId = company.id;
  }
  const job = await prisma.job.create({
    data,
    include: {
      booking: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { service: true } },
        },
      },
    },
  });
  return res.status(201).json(toJobDto(job));
});

// PATCH /api/v1/jobs/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, assignedEmployeeId } = req.body ?? {};
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { service: true } },
        },
      },
    },
  });
  if (!job) {
    return errorResponse(res, 'NOT_FOUND', 'Job not found', 404);
  }
  const isProvider = job.providerId === req.userId;
  const company = req.role === 'COMPANY' ? await prisma.company.findUnique({ where: { ownerId: req.userId } }) : null;
  const isCompanyOwner = company && job.companyId === company.id;
  if (!isProvider && !isCompanyOwner) {
    return errorResponse(res, 'FORBIDDEN', 'Access denied', 403);
  }
  const data = {};
  if (status !== undefined && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
    data.status = status;
  }
  if (assignedEmployeeId !== undefined && req.role === 'COMPANY') {
    data.assignedEmployeeId = assignedEmployeeId || null;
  }
  const updated = await prisma.job.update({
    where: { id },
    data,
    include: {
      booking: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { service: true } },
        },
      },
    },
  });
  return res.json(toJobDto(updated));
});

export default router;
