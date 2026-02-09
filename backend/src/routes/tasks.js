import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function errorResponse(res, code, message, status = 400) {
  return res.status(status).json({
    error: { code, message },
  });
}

function toTaskDto(task) {
  return {
    id: task.id,
    userId: task.userId,
    title: task.title,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

// GET /api/v1/tasks
router.get('/', async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(tasks.map(toTaskDto));
});

// POST /api/v1/tasks
router.post('/', async (req, res) => {
  const { title } = req.body ?? {};
  const titleTrim = typeof title === 'string' ? title.trim() : '';
  if (!titleTrim) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Title is required');
  }
  const task = await prisma.task.create({
    data: {
      userId: req.userId,
      title: titleTrim,
    },
  });
  return res.status(201).json(toTaskDto(task));
});

// PUT /api/v1/tasks/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return errorResponse(res, 'NOT_FOUND', 'Task not found', 404);
  }
  if (task.userId !== req.userId) {
    return errorResponse(res, 'FORBIDDEN', 'Access denied', 403);
  }
  const { title, completed } = req.body ?? {};
  const data = {};
  if (title !== undefined && title !== null) data.title = String(title).trim() || task.title;
  if (completed !== undefined && completed !== null) data.completed = Boolean(completed);
  const updated = await prisma.task.update({
    where: { id },
    data,
  });
  return res.json(toTaskDto(updated));
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return errorResponse(res, 'NOT_FOUND', 'Task not found', 404);
  }
  if (task.userId !== req.userId) {
    return errorResponse(res, 'FORBIDDEN', 'Access denied', 403);
  }
  await prisma.task.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
