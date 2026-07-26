import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** GET /api/wholesalers/me */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { wholesalerId: true },
  });

  if (!user?.wholesalerId) {
    res.status(404).json({ success: false, message: 'Grossiste non trouvé' });
    return;
  }

  const wholesalerData = await prisma.wholesaler.findUnique({
    where: { id: user.wholesalerId },
    include: {
      city: { select: { name: true } },
      _count: { select: { orders: true } },
    },
  });

  res.json({ success: true, data: wholesalerData });
});

/** PUT /api/wholesalers/me */
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { wholesalerId: true },
  });

  if (!user?.wholesalerId) {
    res.status(404).json({ success: false, message: 'Grossiste non trouvé' });
    return;
  }

  const { name, address, phone, email, contactName, contactPhone } = req.body;
  const updated = await prisma.wholesaler.update({
    where: { id: user.wholesalerId },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(contactName !== undefined && { contactName }),
      ...(contactPhone !== undefined && { contactPhone }),
    },
  });

  res.json({ success: true, data: updated });
});

/** GET /api/wholesalers/dashboard */
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { wholesalerId: true },
  });

  if (!user?.wholesalerId) {
    res.status(404).json({ success: false, message: 'Grossiste non trouvé' });
    return;
  }

  const wholesalerId = user.wholesalerId;

  const [totalOrders, pendingOrders, totalRevenue] = await Promise.all([
    prisma.order.count({ where: { wholesalerId } }),
    prisma.order.count({ where: { wholesalerId, orderStatus: { in: ['CREATED', 'CONFIRMED', 'PAID'] } } }),
    prisma.order.aggregate({ where: { wholesalerId, paymentStatus: 'CONFIRMED' }, _sum: { totalAmount: true } }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalOrders, pendingOrders,
        totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
      },
    },
  });
});

export default router;
