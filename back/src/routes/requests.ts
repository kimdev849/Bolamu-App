import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();

/** Helper: obtenir le profil lié */
async function getPharmacyId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { pharmacyId: true } });
  return user?.pharmacyId || null;
}

async function getWholesalerId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { wholesalerId: true } });
  return user?.wholesalerId || null;
}

/** Helper: frais de livraison */
async function getDeliveryFeeForPharmacy(pharmacyId: string): Promise<number> {
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { id: pharmacyId },
    include: { city: { include: { country: { select: { name: true } } } } },
  });
  if (!pharmacy?.city) return 2000;

  const fee = await prisma.deliveryFee.findFirst({
    where: { zone: { cityId: pharmacy.cityId }, deliveryCompanyId: null, isActive: true },
    orderBy: { baseAmount: 'asc' },
  });
  return fee ? fee.baseAmount.toNumber() : 2000;
}

/** GET /api/requests */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { status, urgency, page: pageStr, limit: limitStr } = req.query;
  const page = parseInt(pageStr as string) || 1;
  const limit = parseInt(limitStr as string) || 20;
  const skip = (page - 1) * limit;

  const userId = req.user!.userId;
  const role = req.user!.role;
  const where: any = {};

  const isPharmacy = role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';
  const isWholesaler = role === 'WHOLESALER_ADMIN' || role === 'WHOLESALER_USER';

  if (isPharmacy) {
    const pharmacyId = await getPharmacyId(userId);
    if (pharmacyId) where.pharmacyId = pharmacyId;
  } else if (isWholesaler) {
    const wholesalerId = await getWholesalerId(userId);
    const statusFilter = status && status !== 'all' ? (status === 'active' ? 'SEARCHING' : (status as string).toUpperCase()) : null;

    if (statusFilter === 'MY_RESPONSES' || (status as string)?.toUpperCase() === 'MY_RESPONSES') {
      where.responses = { some: { wholesalerId } };
    } else if (statusFilter) {
      where.status = statusFilter;
    } else {
      where.status = 'SEARCHING';
    }
  }

  if (urgency && urgency !== 'all') {
    where.isUrgent = urgency === 'urgent' || urgency === 'emergency';
  }

  const [data, total] = await Promise.all([
    prisma.request.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        responses: {
          orderBy: { respondedAt: 'desc' },
        },
        pharmacy: { select: { id: true, name: true, cityId: true, phone: true } },
        product: { select: { id: true, name: true, genericName: true } },
      },
    }),
    prisma.request.count({ where }),
  ]);

  res.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/requests/:id */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const request = await prisma.request.findUnique({
    where: { id: req.params.id },
    include: {
      responses: {
        orderBy: { respondedAt: 'desc' },
      },
      pharmacy: { select: { id: true, name: true, phone: true, address: true } },
      product: { select: { id: true, name: true, genericName: true } },
      order: true,
    },
  });

  if (!request) {
    res.status(404).json({ success: false, message: 'Demande non trouvée' });
    return;
  }

  res.json({ success: true, data: request });
});

/** POST /api/requests */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  if (role !== 'PHARMACY_ADMIN' && role !== 'PHARMACY_USER') {
    res.status(403).json({ success: false, message: 'Seules les pharmacies peuvent créer des demandes' });
    return;
  }

  const pharmacyId = await getPharmacyId(req.user!.userId);
  if (!pharmacyId) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  const { productName, quantity, dosage, isUrgent, notes } = req.body;
  if (!productName) {
    res.status(400).json({ success: false, message: 'Nom du produit requis' });
    return;
  }

  // Générer une référence
  const count = await prisma.request.count();
  const reference = `REQ-${String(count + 1).padStart(4, '0')}`;

  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });

  const request = await prisma.request.create({
    data: {
      reference,
      pharmacyId,
      productName,
      quantity: quantity || 1,
      dosage: dosage || null,
      notes: notes || null,
      status: 'SEARCHING',
      isUrgent: isUrgent || false,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  // Notifier les grossistes
  const wholesalers = await prisma.wholesaler.findMany({
    where: { isActive: true },
    select: { users: { select: { id: true } } },
  });

  const notifications = wholesalers.flatMap(w =>
    w.users.map(u => ({
      userId: u.id,
      type: 'NEW_REQUEST' as const,
      title: 'Nouvelle demande',
      message: `${pharmacy?.name || 'Pharmacie'} recherche : ${productName} x${quantity || 1}`,
      payload: { requestId: request.id },
    }))
  );

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }

  res.status(201).json({ success: true, data: request });
});

/** POST /api/requests/:id/accept — FCFS */
router.post('/:id/accept', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  if (role !== 'WHOLESALER_ADMIN' && role !== 'WHOLESALER_USER') {
    res.status(403).json({ success: false, message: 'Seuls les grossistes peuvent accepter' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { wholesalerId: true },
  });

  if (!user?.wholesalerId) {
    res.status(404).json({ success: false, message: 'Grossiste non trouvé' });
    return;
  }

  const wholesalerId = user.wholesalerId;
  const { price } = req.body;
  if (!price || price <= 0) {
    res.status(400).json({ success: false, message: 'Prix du médicament requis' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.request.findUnique({ where: { id: req.params.id } });
      if (!request) throw { status: 404, message: 'Demande non trouvée' };
      if (request.status !== 'SEARCHING') throw { status: 409, message: 'Déjà traitée par un autre grossiste' };

      const wholesaler = await tx.wholesaler.findUnique({ where: { id: wholesalerId } });
      const deliveryAmount = await getDeliveryFeeForPharmacy(request.pharmacyId);
      const productAmount = price * request.quantity;
      const totalAmount = productAmount + deliveryAmount;

      // Mettre à jour la demande
      await tx.request.update({
        where: { id: request.id },
        data: { status: 'FOUND', foundById: wholesalerId, foundAt: new Date() },
      });

      // Créer la réponse
      await tx.requestResponse.create({
        data: { requestId: request.id, wholesalerId, responseType: 'CONFIRMED' },
      });

      // Générer ref commande
      const orderCount = await tx.order.count();
      const reference = `ORD-${String(orderCount + 1).padStart(4, '0')}`;

      // Créer la commande
      const order = await tx.order.create({
        data: {
          reference,
          requestId: request.id,
          pharmacyId: request.pharmacyId,
          wholesalerId,
          productAmount,
          deliveryAmount,
          commissionAmount: 0,
          totalAmount,
          orderStatus: 'CREATED',
          paymentStatus: 'PENDING',
        },
      });

      return { request, order };
    });

    res.json({ success: true, message: 'Demande acceptée — commande créée', data: result });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, message: err.message });
      return;
    }
    throw new AppError('Erreur lors de l\'acceptation', 500);
  }
});

/** POST /api/requests/:id/decline */
router.post('/:id/decline', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  if (role !== 'WHOLESALER_ADMIN' && role !== 'WHOLESALER_USER') {
    res.status(403).json({ success: false, message: 'Seuls les grossistes peuvent décliner' });
    return;
  }

  const wholesaler = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { wholesalerId: true },
  });

  if (!wholesaler?.wholesalerId) {
    res.status(404).json({ success: false, message: 'Grossiste non trouvé' });
    return;
  }

  const request = await prisma.request.findUnique({ where: { id: req.params.id } });
  if (!request) {
    res.status(404).json({ success: false, message: 'Demande non trouvée' });
    return;
  }

  if (request.status !== 'SEARCHING') {
    res.status(400).json({ success: false, message: 'Demande déjà traitée' });
    return;
  }

  await prisma.requestResponse.create({
    data: { requestId: request.id, wholesalerId: wholesaler.wholesalerId, responseType: 'DECLINED' },
  });

  res.json({ success: true, message: 'Décliné — la demande reste ouverte' });
});

/** POST /api/requests/:id/confirm */
router.post('/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  if (role !== 'PHARMACY_ADMIN' && role !== 'PHARMACY_USER') {
    res.status(403).json({ success: false, message: 'Seules les pharmacies peuvent confirmer' });
    return;
  }

  const pharmacyId = await getPharmacyId(req.user!.userId);
  if (!pharmacyId) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.request.findUnique({ where: { id: req.params.id }, include: { order: true } });
    if (!request || request.pharmacyId !== pharmacyId) throw { status: 404, message: 'Demande non trouvée' };
    if (request.status !== 'FOUND') throw { status: 400, message: 'Impossible de confirmer' };

    if (request.order) {
      await tx.order.update({ where: { id: request.order.id }, data: { orderStatus: 'CONFIRMED' } });
    }

    return request;
  });

  // Créer une notification pour le grossiste
  if (result.foundById) {
    const wholesalerUsers = await prisma.wholesaler.findUnique({
      where: { id: result.foundById },
      select: { users: { select: { id: true } } },
    });
    if (wholesalerUsers?.users) {
      await prisma.notification.createMany({
        data: wholesalerUsers.users.map(u => ({
          userId: u.id,
          type: 'ORDER_CONFIRMED' as const,
          title: 'Commande confirmée',
          message: `La pharmacie a confirmé la commande #${result.reference}`,
          payload: { requestId: result.id },
        })),
      });
    }
  }

  res.json({ success: true, message: 'Commande confirmée', data: result });
});

/** POST /api/requests/:id/cancel */
router.post('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  const isPharmacy = role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';
  const isAdmin = role === 'SUPER_ADMIN';
  const pharmacyId = isPharmacy ? await getPharmacyId(req.user!.userId) : null;

  const request = await prisma.request.findUnique({ where: { id: req.params.id }, include: { order: true } });
  if (!request) {
    res.status(404).json({ success: false, message: 'Demande non trouvée' });
    return;
  }

  if (!isAdmin && (!pharmacyId || request.pharmacyId !== pharmacyId)) {
    res.status(403).json({ success: false, message: 'Non autorisé' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.request.update({ where: { id: request.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    if (request.order) {
      await tx.order.update({ where: { id: request.order.id }, data: { orderStatus: 'CANCELLED' } });
    }
  });

  res.json({ success: true, message: 'Demande annulée' });
});

/** POST /api/requests/:id/mark-paid */
router.post('/:id/mark-paid', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  const isAllowed = role === 'SUPER_ADMIN' || role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';
  if (!isAllowed) {
    res.status(403).json({ success: false, message: 'Non autorisé' });
    return;
  }

  const request = await prisma.request.findUnique({ where: { id: req.params.id }, include: { order: true } });
  if (!request?.order) {
    res.status(404).json({ success: false, message: 'Commande non trouvée' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: request.order!.id },
      data: { paymentStatus: 'CONFIRMED' },
    });
    await tx.payment.create({
      data: {
        orderId: request.order!.id,
        amount: request.order!.totalAmount,
        method: 'MANUAL',
        status: 'CONFIRMED',
        paidById: req.user!.userId,
        paidAt: new Date(),
      },
    });
  });

  res.json({ success: true, message: 'Paiement confirmé' });
});

export default router;
