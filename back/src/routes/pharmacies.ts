import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** GET /api/pharmacies/me */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      pharmacy: {
        include: {
          city: { select: { name: true } },
          zone: { select: { name: true } },
          _count: { select: { requests: true, orders: true } },
        },
      },
    },
  });

  if (!user?.pharmacy) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  res.json({ success: true, data: { ...user.pharmacy, users: undefined } });
});

/** PUT /api/pharmacies/me */
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { pharmacyId: true },
  });

  if (!user?.pharmacyId) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  const { name, address, phone, email, contactName, contactPhone } = req.body;
  const updated = await prisma.pharmacy.update({
    where: { id: user.pharmacyId },
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

/** GET /api/pharmacies/dashboard */
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { pharmacyId: true },
  });

  if (!user?.pharmacyId) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  const pharmacyId = user.pharmacyId;

  const [totalRequests, searchingRequests, totalOrders, activeOrders, totalSpent, recentRequests, recentOrders] =
    await Promise.all([
      prisma.request.count({ where: { pharmacyId } }),
      prisma.request.count({ where: { pharmacyId, status: 'SEARCHING' } }),
      prisma.order.count({ where: { pharmacyId } }),
      prisma.order.count({ where: { pharmacyId, orderStatus: { notIn: ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'] } } }),
      prisma.order.aggregate({ where: { pharmacyId, paymentStatus: 'CONFIRMED' }, _sum: { totalAmount: true } }),
      prisma.request.findMany({ where: { pharmacyId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.order.findMany({ where: { pharmacyId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalRequests, searchingRequests, totalOrders, activeOrders,
        totalSpent: totalSpent._sum.totalAmount?.toNumber() || 0,
      },
      recentRequests, recentOrders,
    },
  });
});

export default router;
