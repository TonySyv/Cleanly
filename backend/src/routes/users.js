import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { toUserDto } from '../lib/userDto.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({
    error: { code, message },
  });
}

// GET /api/v1/users/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (req.userId !== id) {
    return errorResponse(res, 'FORBIDDEN', 'Access denied', 403);
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    return errorResponse(res, 'USER_NOT_FOUND', 'User not found', 404);
  }
  return res.json(toUserDto(user));
});

// PUT /api/v1/users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (req.userId !== id) {
    return errorResponse(res, 'FORBIDDEN', 'Access denied', 403);
  }
  const { name, avatarUrl } = req.body ?? {};
  const data = {};
  if (name !== undefined) data.name = String(name).trim() || undefined;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl === null || avatarUrl === '' ? null : String(avatarUrl);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true, updatedAt: true },
  });
  return res.json(toUserDto(user));
});

export default router;
