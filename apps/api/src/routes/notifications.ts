import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/mark-all-read
notificationsRouter.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});
