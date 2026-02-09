import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['PLATFORM_ADMIN']));

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({ error: { code, message } });
}

function toServiceDto(s) {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? null,
    basePriceCents: s.basePriceCents,
    durationMinutes: s.durationMinutes,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// GET /api/v1/admin/services
router.get('/', async (req, res) => {
  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' },
  });
  return res.json(services.map(toServiceDto));
});

// POST /api/v1/admin/services
router.post('/', async (req, res) => {
  const { name, description, basePriceCents, durationMinutes, active } = req.body ?? {};
  const nameTrim = typeof name === 'string' ? name.trim() : '';
  if (!nameTrim) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Name is required');
  }
  const basePrice = parseInt(basePriceCents, 10);
  const duration = parseInt(durationMinutes, 10);
  if (Number.isNaN(basePrice) || basePrice < 0) {
    return errorResponse(res, 'VALIDATION_ERROR', 'basePriceCents must be a non-negative number');
  }
  if (Number.isNaN(duration) || duration <= 0) {
    return errorResponse(res, 'VALIDATION_ERROR', 'durationMinutes must be a positive number');
  }
  const service = await prisma.service.create({
    data: {
      name: nameTrim,
      description: typeof description === 'string' ? description.trim() || null : null,
      basePriceCents: basePrice,
      durationMinutes: duration,
      active: active !== false,
    },
  });
  return res.status(201).json(toServiceDto(service));
});

// PUT /api/v1/admin/services/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return errorResponse(res, 'NOT_FOUND', 'Service not found', 404);
  }
  const { name, description, basePriceCents, durationMinutes, active } = req.body ?? {};
  const data = {};
  if (name !== undefined) data.name = String(name).trim() || service.name;
  if (description !== undefined) data.description = typeof description === 'string' ? description.trim() || null : service.description;
  if (basePriceCents !== undefined) {
    const n = parseInt(basePriceCents, 10);
    if (!Number.isNaN(n) && n >= 0) data.basePriceCents = n;
  }
  if (durationMinutes !== undefined) {
    const n = parseInt(durationMinutes, 10);
    if (!Number.isNaN(n) && n > 0) data.durationMinutes = n;
  }
  if (active !== undefined) data.active = Boolean(active);
  const updated = await prisma.service.update({
    where: { id },
    data,
  });
  return res.json(toServiceDto(updated));
});

// DELETE /api/v1/admin/services/:id (soft: set active false if referenced, else delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const service = await prisma.service.findUnique({
    where: { id },
    include: { _count: { select: { bookingServices: true } } },
  });
  if (!service) {
    return errorResponse(res, 'NOT_FOUND', 'Service not found', 404);
  }
  if (service._count.bookingServices > 0) {
    const updated = await prisma.service.update({
      where: { id },
      data: { active: false },
    });
    return res.json(toServiceDto(updated));
  }
  await prisma.service.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
