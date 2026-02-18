import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Provider and company use the same cabinet: same profile, verification, and job-pickup flow (see BOOKING_PLATFORM_PLAN § 0).
router.use(requireAuth);
router.use(requireRole(['PROVIDER', 'COMPANY']));

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({ error: { code, message } });
}

// GET /api/v1/provider/company - companies only
router.get('/company', async (req, res) => {
  if (req.role !== 'COMPANY') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only companies' } });
  }
  const company = await prisma.company.findUnique({
    where: { ownerId: req.userId },
  });
  if (!company) return res.json(null);
  return res.json({
    id: company.id,
    name: company.name,
    ownerId: company.ownerId,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  });
});

// POST /api/v1/provider/company - create company (companies only)
router.post('/company', async (req, res) => {
  if (req.role !== 'COMPANY') {
    return errorResponse(res, 'FORBIDDEN', 'Only companies can create a company', 403);
  }
  const existing = await prisma.company.findUnique({
    where: { ownerId: req.userId },
  });
  if (existing) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Company already exists', 409);
  }
  const name = (req.body?.name && String(req.body.name).trim()) || 'My Company';
  const company = await prisma.company.create({
    data: { ownerId: req.userId, name },
  });
  return res.status(201).json({
    id: company.id,
    name: company.name,
    ownerId: company.ownerId,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  });
});

// GET /api/v1/provider/profile
router.get('/profile', async (req, res) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.userId },
  });
  if (!profile) {
    return res.json({
      verificationStatus: 'PENDING',
      documentUrls: [],
      offeredServiceIds: [],
    });
  }
  return res.json({
    id: profile.id,
    userId: profile.userId,
    verificationStatus: profile.verificationStatus,
    documentUrls: profile.documentUrls || [],
    offeredServiceIds: profile.offeredServiceIds || [],
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

// PUT /api/v1/provider/profile
router.put('/profile', async (req, res) => {
  const { verificationStatus, documentUrls, offeredServiceIds } = req.body ?? {};
  const data = {};
  if (Array.isArray(documentUrls)) {
    data.documentUrls = documentUrls.filter((u) => typeof u === 'string');
  }
  if (Array.isArray(offeredServiceIds)) {
    const valid = await prisma.service.findMany({
      where: { id: { in: offeredServiceIds }, active: true },
      select: { id: true },
    });
    data.offeredServiceIds = valid.map((s) => s.id);
  }
  if (verificationStatus !== undefined && ['PENDING', 'VERIFIED', 'REJECTED'].includes(verificationStatus)) {
    data.verificationStatus = verificationStatus;
  }
  const profile = await prisma.providerProfile.upsert({
    where: { userId: req.userId },
    create: {
      userId: req.userId,
      documentUrls: data.documentUrls || [],
      offeredServiceIds: data.offeredServiceIds || [],
      verificationStatus: data.verificationStatus || 'PENDING',
    },
    update: data,
  });
  return res.json({
    id: profile.id,
    userId: profile.userId,
    verificationStatus: profile.verificationStatus,
    documentUrls: profile.documentUrls || [],
    offeredServiceIds: profile.offeredServiceIds || [],
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

// GET /api/v1/provider/employees - companies only
router.get('/employees', async (req, res) => {
  if (req.role !== 'COMPANY') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only companies can list employees' } });
  }
  const company = await prisma.company.findUnique({
    where: { ownerId: req.userId },
    include: { employeeLinks: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  if (!company) {
    return res.json([]);
  }
  return res.json(
    company.employeeLinks.map((e) => ({
      id: e.id,
      userId: e.userId,
      role: e.role,
      user: e.user,
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

// POST /api/v1/provider/employees - invite/link user as employee
router.post('/employees', async (req, res) => {
  if (req.role !== 'COMPANY') {
    return errorResponse(res, 'FORBIDDEN', 'Only companies can add employees', 403);
  }
  const { userId, email, name, password, role } = req.body ?? {};
  let targetUserId = userId;
  if (!targetUserId && email) {
    let user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!user) {
      if (!name || !password) {
        return errorResponse(res, 'VALIDATION_ERROR', 'For new user, name and password are required');
      }
      const bcrypt = await import('bcryptjs');
      user = await prisma.user.create({
        data: {
          email: String(email).trim().toLowerCase(),
          name: String(name).trim(),
          passwordHash: await bcrypt.default.hash(String(password), 12),
          role: 'EMPLOYEE',
        },
      });
    }
    targetUserId = user.id;
  }
  if (!targetUserId) {
    return errorResponse(res, 'VALIDATION_ERROR', 'userId or email is required');
  }
  const company = await prisma.company.findUnique({ where: { ownerId: req.userId } });
  if (!company) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Company not found', 404);
  }
  const existing = await prisma.companyEmployee.findUnique({ where: { userId: targetUserId } });
  if (existing) {
    return errorResponse(res, 'VALIDATION_ERROR', 'User is already an employee of a company', 409);
  }
  const link = await prisma.companyEmployee.create({
    data: {
      companyId: company.id,
      userId: targetUserId,
      role: role || 'cleaner',
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await prisma.user.update({
    where: { id: targetUserId },
    data: { companyId: company.id },
  });
  return res.status(201).json({
    id: link.id,
    userId: link.userId,
    role: link.role,
    user: link.user,
    createdAt: link.createdAt.toISOString(),
  });
});

// DELETE /api/v1/provider/employees/:id
router.delete('/employees/:id', async (req, res) => {
  if (req.role !== 'COMPANY') {
    return errorResponse(res, 'FORBIDDEN', 'Only companies can remove employees', 403);
  }
  const company = await prisma.company.findUnique({ where: { ownerId: req.userId } });
  if (!company) {
    return errorResponse(res, 'NOT_FOUND', 'Company not found', 404);
  }
  const link = await prisma.companyEmployee.findFirst({
    where: { id: req.params.id, companyId: company.id },
  });
  if (!link) {
    return errorResponse(res, 'NOT_FOUND', 'Employee link not found', 404);
  }
  await prisma.user.update({ where: { id: link.userId }, data: { companyId: null } });
  await prisma.companyEmployee.delete({ where: { id: link.id } });
  return res.status(204).send();
});

export default router;
