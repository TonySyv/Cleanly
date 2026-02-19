import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

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

/**
 * GET /api/v1/services - List active services only (public/customer for booking).
 * Inactive services are not exposed; admins use GET /api/v1/admin/services for full list.
 */
router.get('/', async (req, res) => {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  return res.json(services.map(toServiceDto));
});

export default router;
