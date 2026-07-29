import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** GET /api/notifications */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });

  res.json({ success: true, data: { notifications, unreadCount } });
});

/** PATCH /api/notifications/:id/read */
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true, readAt: new Date() },
  });

  res.json({ success: true, message: 'Notification marquée comme lue' });
});

/** PATCH /api/notifications/read-all */
router.patch('/read-all', requireAuth, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
});

export default router;
