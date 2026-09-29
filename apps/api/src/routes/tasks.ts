import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import { createTaskSchema, updateTaskSchema } from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';

export const tasksRouter = Router();

// GET /api/tasks
tasksRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, priority, dueToday } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (type && typeof type === 'string' && type !== 'ALL') {
      where.type = type;
    }
    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      where.priority = priority;
    }
    if (dueToday === 'true') {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.dueAt = { lte: endOfDay };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueAt: 'asc' }],
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
tasksRouter.post('/', validateBody(createTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const task = await prisma.task.create({
      data: {
        ...data,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id
tasksRouter.patch('/:id', validateBody(updateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const updateData: any = { ...data };
    if (data.dueAt !== undefined) {
      updateData.dueAt = data.dueAt ? new Date(data.dueAt) : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.task.delete({
      where: { id },
    });
    res.json({ message: 'Task deleted successfully', id });
  } catch (error) {
    next(error);
  }
});
