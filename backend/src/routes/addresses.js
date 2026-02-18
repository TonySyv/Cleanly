import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['CUSTOMER']));

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({ error: { code, message } });
}

function toAddressDto(addr) {
  return {
    id: addr.id,
    label: addr.label,
    line1: addr.line1,
    line2: addr.line2 ?? null,
    city: addr.city ?? null,
    postalCode: addr.postalCode ?? null,
    country: addr.country ?? null,
  };
}

// GET /api/v1/addresses - list addresses for current user
router.get('/', async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
  });
  return res.json(addresses.map(toAddressDto));
});

// POST /api/v1/addresses - create address
router.post('/', async (req, res) => {
  const { label, line1, line2, city, postalCode, country } = req.body ?? {};
  if (!label || typeof label !== 'string' || !label.trim()) {
    return errorResponse(res, 'VALIDATION_ERROR', 'label is required');
  }
  if (!line1 || typeof line1 !== 'string' || !line1.trim()) {
    return errorResponse(res, 'VALIDATION_ERROR', 'line1 is required');
  }
  const address = await prisma.address.create({
    data: {
      userId: req.userId,
      label: label.trim(),
      line1: line1.trim(),
      line2: typeof line2 === 'string' ? line2.trim() || null : null,
      city: typeof city === 'string' ? city.trim() || null : null,
      postalCode: typeof postalCode === 'string' ? postalCode.trim() || null : null,
      country: typeof country === 'string' ? country.trim() || null : null,
    },
  });
  return res.status(201).json(toAddressDto(address));
});

// PATCH /api/v1/addresses/:id - update address
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return errorResponse(res, 'NOT_FOUND', 'Address not found', 404);
  }
  const { label, line1, line2, city, postalCode, country } = req.body ?? {};
  const data = {};
  if (label !== undefined) data.label = typeof label === 'string' ? label.trim() : existing.label;
  if (line1 !== undefined) data.line1 = typeof line1 === 'string' ? line1.trim() : existing.line1;
  if (line2 !== undefined) data.line2 = typeof line2 === 'string' ? line2.trim() || null : existing.line2;
  if (city !== undefined) data.city = typeof city === 'string' ? city.trim() || null : existing.city;
  if (postalCode !== undefined) data.postalCode = typeof postalCode === 'string' ? postalCode.trim() || null : existing.postalCode;
  if (country !== undefined) data.country = typeof country === 'string' ? country.trim() || null : existing.country;
  const address = await prisma.address.update({
    where: { id },
    data,
  });
  return res.json(toAddressDto(address));
});

// DELETE /api/v1/addresses/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return errorResponse(res, 'NOT_FOUND', 'Address not found', 404);
  }
  await prisma.address.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
