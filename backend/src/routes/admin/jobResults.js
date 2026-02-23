import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['PLATFORM_ADMIN']));

const adminJobResultInclude = {
  booking: {
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { include: { service: true } },
    },
  },
  completion: true,
  review: true,
  provider: { select: { id: true, name: true, email: true } },
  company: { select: { id: true, name: true } },
  assignedEmployee: { select: { id: true, name: true, email: true } },
};

function toAdminJobResultDto(job) {
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
    provider: j.provider
      ? { id: j.provider.id, name: j.provider.name, email: j.provider.email }
      : null,
    company: j.company ? { id: j.company.id, name: j.company.name } : null,
    assignedEmployee: j.assignedEmployee
      ? { id: j.assignedEmployee.id, name: j.assignedEmployee.name, email: j.assignedEmployee.email }
      : null,
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

// GET /api/v1/admin/job-results - all completed jobs (admin)
router.get('/', async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    include: adminJobResultInclude,
  });
  return res.json(jobs.map(toAdminJobResultDto));
});

export default router;
