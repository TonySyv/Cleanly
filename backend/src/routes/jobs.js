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

const jobInclude = {
  booking: {
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { include: { service: true } },
    },
  },
  completion: true,
  review: true,
};

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
    completion: j.completion
      ? {
          completedAt: j.completion.completedAt.toISOString(),
          notes: j.completion.notes ?? null,
          photoUrls: j.completion.photoUrls || [],
        }
      : null,
    review: j.review
      ? {
          rating: j.review.rating,
          comment: j.review.comment ?? null,
          createdAt: j.review.createdAt.toISOString(),
        }
      : null,
  };
}

function validPhotoUrls(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((u) => typeof u === 'string');
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
    include: jobInclude,
  });
  return res.json(jobs.map(toJobDto));
});

// GET /api/v1/jobs/available - bookings needing a provider (no job yet, CONFIRMED or PENDING)
router.get('/available', async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: {
      job: null,
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { include: { service: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });
  const list = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    scheduledAt: b.scheduledAt.toISOString(),
    address: b.address,
    totalPriceCents: b.totalPriceCents,
    customer: b.customer
      ? { id: b.customer.id, name: b.customer.name, email: b.customer.email }
      : null,
    items: (b.items || []).map((i) => ({
      serviceName: i.service?.name,
      quantity: i.quantity,
      priceCents: i.priceCents,
    })),
  }));
  return res.json(list);
});

// POST /api/v1/jobs - pick up a booking
router.post('/', async (req, res) => {
  const { bookingId } = req.body ?? {};
  if (!bookingId) {
    return errorResponse(res, 'VALIDATION_ERROR', 'bookingId is required');
  }

   // Gate job pickup on verification status: only VERIFIED providers/companies can pick up new jobs
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.userId },
  });
  if (!profile || profile.verificationStatus !== 'VERIFIED') {
    return errorResponse(res, 'FORBIDDEN', 'Complete verification to pick up jobs', 403);
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
    include: jobInclude,
  });
  return res.status(201).json(toJobDto(job));
});

// PATCH /api/v1/jobs/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, assignedEmployeeId, completionNotes, completionPhotoUrls } = req.body ?? {};
  const job = await prisma.job.findUnique({
    where: { id },
    include: jobInclude,
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
  // Do not allow downgrading from COMPLETED
  if (job.status === 'COMPLETED' && status !== undefined && status !== 'COMPLETED') {
    return errorResponse(res, 'VALIDATION_ERROR', 'Cannot change status from COMPLETED', 400);
  }
  const data = {};
  if (status !== undefined && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
    data.status = status;
  }
  if (assignedEmployeeId !== undefined && req.role === 'COMPANY') {
    const newEmployeeId = assignedEmployeeId || null;
    data.assignedEmployeeId = newEmployeeId;
    if (newEmployeeId && job.companyId) {
      const link = await prisma.companyEmployee.findFirst({
        where: { companyId: job.companyId, userId: newEmployeeId },
      });
      if (!link) {
        return errorResponse(res, 'VALIDATION_ERROR', 'Employee must belong to your company', 400);
      }
    }
  }

  const completingNow = data.status === 'COMPLETED';
  const notes = completionNotes != null ? String(completionNotes).trim() || null : undefined;
  const photoUrls = completionPhotoUrls != null ? validPhotoUrls(completionPhotoUrls) : undefined;
  const updatingCompletion =
    completingNow || (job.status === 'COMPLETED' && (notes !== undefined || photoUrls !== undefined));

  const updated = await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id },
      data,
    });
    if (updatingCompletion) {
      const now = new Date();
      if (job.completion) {
        const updateData = {};
        if (notes !== undefined) updateData.notes = notes;
        if (photoUrls !== undefined) updateData.photoUrls = photoUrls;
        if (Object.keys(updateData).length > 0) {
          await tx.jobCompletion.update({
            where: { jobId: id },
            data: updateData,
          });
        }
      } else {
        await tx.jobCompletion.create({
          data: {
            jobId: id,
            completedAt: now,
            notes: notes ?? null,
            photoUrls: photoUrls ?? [],
          },
        });
      }
    }
    return tx.job.findUnique({
      where: { id },
      include: jobInclude,
    });
  });

  return res.json(toJobDto(updated));
});

export default router;
export { toJobDto, jobInclude };
