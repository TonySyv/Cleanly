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
 * GET /api/v1/services - List active services (public/customer for booking)
 */
router.get('/', async (req, res) => {
  const activeOnly = req.query.active !== 'false';
  const services = await prisma.service.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { name: 'asc' },
  });
  return res.json(services.map(toServiceDto));
});

export default router;
