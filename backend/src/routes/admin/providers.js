import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['PLATFORM_ADMIN']));

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({ error: { code, message } });
}

// GET /api/v1/admin/providers - list providers and companies with verification info
router.get('/', async (req, res) => {
  const { status } = req.query ?? {};
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['PROVIDER', 'COMPANY'] },
    },
    include: {
      providerProfile: {
        include: {
          documents: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const normalized = users.map((u) => {
    const profile = u.providerProfile;
    const effectiveStatus = profile?.verificationStatus ?? 'PENDING';
    const documentCount = profile?.documents?.length ?? 0;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      verificationStatus: effectiveStatus,
      verificationNotes: profile?.verificationNotes ?? null,
      documentCount,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  });

  const filtered =
    typeof status === 'string' && status
      ? normalized.filter((u) => u.verificationStatus === status.toUpperCase())
      : normalized;

  return res.json(filtered);
});

// GET /api/v1/admin/providers/:id/documents - list verification documents for a provider/company
router.get('/:id/documents', async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { providerProfile: true },
  });
  if (!user || (user.role !== 'PROVIDER' && user.role !== 'COMPANY')) {
    return errorResponse(res, 'NOT_FOUND', 'Provider/company not found', 404);
  }

  const profile = user.providerProfile;
  if (!profile) {
    return res.json([]);
  }

  const documents = await prisma.verificationDocument.findMany({
    where: { profileId: profile.id },
    orderBy: { uploadedAt: 'desc' },
  });

  return res.json(
    documents.map((d) => ({
      id: d.id,
      type: d.type,
      fileUrl: d.fileUrl,
      status: d.status,
      uploadedAt: d.uploadedAt.toISOString(),
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
      reviewedByAdminId: d.reviewedByAdminId ?? null,
      rejectionReason: d.rejectionReason ?? null,
    }))
  );
});

// POST /api/v1/admin/providers/:id/verify - approve or reject verification
router.post('/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body ?? {};
  const statusValue = typeof status === 'string' ? status.toUpperCase() : '';
  if (statusValue !== 'VERIFIED' && statusValue !== 'REJECTED') {
    return errorResponse(res, 'VALIDATION_ERROR', "status must be 'VERIFIED' or 'REJECTED'");
  }
  if (statusValue === 'REJECTED' && (!reason || !String(reason).trim())) {
    return errorResponse(res, 'VALIDATION_ERROR', 'reason is required when rejecting');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { providerProfile: true },
  });
  if (!user || (user.role !== 'PROVIDER' && user.role !== 'COMPANY')) {
    return errorResponse(res, 'NOT_FOUND', 'Provider/company not found', 404);
  }

  let profile = user.providerProfile;
  const notes = statusValue === 'REJECTED' ? String(reason).trim() : null;

  if (!profile) {
    profile = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        verificationStatus: statusValue,
        verificationNotes: notes,
        documentUrls: [],
        offeredServiceIds: [],
      },
    });
  } else {
    profile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: statusValue,
        verificationNotes: notes,
      },
    });
  }

  await prisma.verificationHistory.create({
    data: {
      profileId: profile.id,
      action: statusValue === 'VERIFIED' ? 'APPROVED' : 'REJECTED',
      adminUserId: req.userId,
      reason: notes,
    },
  });

  return res.json({
    id: profile.id,
    userId: profile.userId,
    verificationStatus: profile.verificationStatus,
    verificationNotes: profile.verificationNotes ?? null,
    documentUrls: profile.documentUrls || [],
    offeredServiceIds: profile.offeredServiceIds || [],
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

export default router;

