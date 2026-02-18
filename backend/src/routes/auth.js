import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db.js';
import { signAccessToken, signRefreshToken, verifyToken, ACCESS_EXPIRY_SECONDS } from '../lib/jwt.js';
import { toUserDto } from '../lib/userDto.js';

const router = Router();

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({
    error: { code, message },
  });
}

const ALLOWED_ROLES = ['CUSTOMER', 'PROVIDER', 'COMPANY', 'EMPLOYEE', 'PLATFORM_ADMIN'];

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body ?? {};
  if (!email || !password || !name) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Email, password, and name are required');
  }
  const emailTrim = String(email).trim().toLowerCase();
  const nameTrim = String(name).trim();
  const roleValue = role && ALLOWED_ROLES.includes(String(role).toUpperCase())
    ? String(role).toUpperCase()
    : 'CUSTOMER';
  if (!emailTrim || !nameTrim || String(password).length < 6) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Invalid email, name, or password (min 6 characters)');
  }

  const existing = await prisma.user.findUnique({ where: { email: emailTrim } });
  if (existing) {
    return errorResponse(res, 'USER_EXISTS', 'User with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(String(password), 12);
  const user = await prisma.user.create({
    data: {
      email: emailTrim,
      passwordHash,
      name: nameTrim,
      role: roleValue,
    },
  });

  const userId = user.id;
  const accessToken = signAccessToken({ userId, role: user.role });
  const refreshToken = signRefreshToken({ userId, type: 'refresh', role: user.role });

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return res.status(201).json({
    accessToken,
    refreshToken,
    expiresIn: ACCESS_EXPIRY_SECONDS,
    user: toUserDto(user),
  });
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  console.log('[auth] POST /login received', { bodyKeys: req.body ? Object.keys(req.body) : [] });
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Email and password are required');
  }
  const emailTrim = String(email).trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: emailTrim } });
  if (!user) {
    return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(String(password), user.passwordHash);
  if (!valid) {
    return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, type: 'refresh', role: user.role });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return res.json({
    accessToken,
    refreshToken,
    expiresIn: ACCESS_EXPIRY_SECONDS,
    user: toUserDto(user),
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken: token } = req.body ?? {};
  if (!token) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Refresh token is required');
  }

  let payload;
  try {
    payload = verifyToken(token);
    if (payload.type !== 'refresh') throw new Error('Invalid token type');
  } catch {
    return errorResponse(res, 'INVALID_TOKEN', 'Invalid or expired refresh token', 401);
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { token, userId: payload.userId },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    return errorResponse(res, 'INVALID_TOKEN', 'Invalid or expired refresh token', 401);
  }

  const user = stored.user;
  const newAccessToken = signAccessToken({ userId: user.id, role: user.role });

  return res.json({
    accessToken: newAccessToken,
    refreshToken: token,
    expiresIn: ACCESS_EXPIRY_SECONDS,
    user: toUserDto(user),
  });
});

export default router;
