import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** Helper: obtenir l'ID de l'entité liée */
async function getEntityId(userId: string, role: string): Promise<{ pharmacyId?: string; wholesalerId?: string; deliveryCompanyId?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pharmacyId: true, wholesalerId: true, deliveryCompanyId: true },
  });
  if (!user) return {};
  return {
    pharmacyId: user.pharmacyId || undefined,
    wholesalerId: user.wholesalerId || undefined,
    deliveryCompanyId: user.deliveryCompanyId || undefined,
  };
}

/** GET /api/orders */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { status, page: pageStr, limit: limitStr } = req.query;
  const page = parseInt(pageStr as string) || 1;
  const limit = parseInt(limitStr as string) || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.orderStatus = (status as string).toUpperCase();

  const role = req.user!.role;
  const ids = await getEntityId(req.user!.userId, role);

  if (ids.pharmacyId) where.pharmacyId = ids.pharmacyId;
  else if (ids.wholesalerId) where.wholesalerId = ids.wholesalerId;
  else if (ids.deliveryCompanyId) {
    // DeliveryCompany relationship goes through the Delivery model
    const deliveryOrderIds = (await prisma.delivery.findMany({
      where: { deliveryCompanyId: ids.deliveryCompanyId },
      select: { orderId: true },
    })).map(d => d.orderId);
    where.id = { in: deliveryOrderIds };
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        request: { select: { id: true, reference: true, isUrgent: true, notes: true } },
        delivery: { include: { deliveryCompany: { select: { id: true, name: true } } } },
        payment: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/orders/:id */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      request: {
        include: {
          pharmacy: { select: { id: true, name: true, address: true, phone: true } },
          responses: true,
        },
      },
      payment: true,
      pharmacy: { select: { id: true, name: true, phone: true } },
      wholesaler: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!order) {
    res.status(404).json({ success: false, message: 'Commande non trouvée' });
    return;
  }

  res.json({ success: true, data: order });
});

/** POST /api/orders/:id/assign-delivery (admin) */
router.post('/:id/assign-delivery', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Seul l\'admin peut assigner la livraison' });
    return;
  }

  const { deliveryCompanyId } = req.body;
  if (!deliveryCompanyId) {
    res.status(400).json({ success: false, message: 'Entreprise de livraison requise' });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) {
    res.status(404).json({ success: false, message: 'Commande non trouvée' });
    return;
  }

  if (order.paymentStatus !== 'CONFIRMED') {
    res.status(400).json({ success: false, message: 'Le paiement doit être confirmé avant d\'assigner la livraison' });
    return;
  }

  const company = await prisma.deliveryCompany.findUnique({ where: { id: deliveryCompanyId } });
  if (!company) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }

  // Créer la Delivery et mettre à jour la commande
  const result = await prisma.$transaction(async (tx) => {
    await tx.delivery.create({
      data: {
        orderId: order.id,
        deliveryCompanyId: company.id,
        deliveryType: 'STANDARD',
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { deliveryStatus: 'ASSIGNED' },
    });

    return updated;
  });

  res.json({ success: true, data: result, message: 'Livraison assignée' });
});

/** PATCH /api/orders/:id/status */
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  const { orderStatus, deliveryStatus } = req.body;
  const data: any = {};
  if (orderStatus) data.orderStatus = (orderStatus as string).toUpperCase();
  if (deliveryStatus) data.deliveryStatus = (deliveryStatus as string).toUpperCase();

  if (data.orderStatus === 'DELIVERED' || data.orderStatus === 'COMPLETED') {
    data.deliveryStatus = 'DELIVERED';
  }

  const updated = await prisma.order.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: updated });
});

export default router;
