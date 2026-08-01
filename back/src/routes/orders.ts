import crypto from 'crypto';
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

/** Helper: générer un code OTP à 4 chiffres (cryptographiquement aléatoire) */
function generateOtpCode(): string {
  return String(crypto.randomInt(1000, 10000));
}

/** Helper: récupérer les paramètres OTP (durée de validité + tentatives max) */
async function getOtpSettings(): Promise<{ expirySeconds: number; maxAttempts: number }> {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['otp_expiry_seconds', 'otp_max_attempts'] } },
  });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return {
    expirySeconds: parseInt(map.otp_expiry_seconds) || 600,
    maxAttempts: parseInt(map.otp_max_attempts) || 3,
  };
}

/** Seules la pharmacie et l'admin peuvent voir le code OTP */
function canViewOtp(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';
}

/** Retirer les données sensibles OTP pour les rôles non autorisés */
function maskOtp<T extends Record<string, any>>(order: T | null): T | null {
  if (!order) return order;
  const { otpCode, otpAttempts, ...rest } = order;
  return rest as T;
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
        request: { select: { id: true, reference: true, isUrgent: true, notes: true, productName: true, quantity: true } },
        pharmacy: { select: { id: true, name: true, phone: true } },
        wholesaler: { select: { id: true, name: true, phone: true } },
        delivery: { include: { deliveryCompany: { select: { id: true, name: true } } } },
        payment: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  const masked = canViewOtp(role) ? data : data.map((o) => maskOtp(o as any));

  res.json({ success: true, data: masked, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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

  const masked = canViewOtp(req.user!.role) ? order : maskOtp(order as any);
  res.json({ success: true, data: masked });
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

  // Générer un code OTP pour la confirmation de livraison
  const otpSettings = await getOtpSettings();
  const otpCode = generateOtpCode();

  // Créer la Delivery, générer l'OTP et mettre à jour la commande
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
      data: {
        deliveryStatus: 'ASSIGNED',
        otpCode,
        otpExpiresAt: new Date(Date.now() + otpSettings.expirySeconds * 1000),
        otpAttempts: 0,
        otpVerifiedAt: null,
      },
    });

    return updated;
  });

  res.json({ success: true, data: result, message: 'Livraison assignée — code OTP généré' });
});

/** POST /api/orders/:id/generate-otp (pharmacie) */
router.post('/:id/generate-otp', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  const isPharmacy = role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';
  if (!isPharmacy && role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Seule la pharmacie peut générer le code OTP' });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) {
    res.status(404).json({ success: false, message: 'Commande non trouvée' });
    return;
  }

  // Vérifier que la pharmacie est bien propriétaire de la commande
  if (isPharmacy) {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { pharmacyId: true } });
    if (!user?.pharmacyId || user.pharmacyId !== order.pharmacyId) {
      res.status(403).json({ success: false, message: 'Non autorisé' });
      return;
    }
  }

  if (order.otpVerifiedAt) {
    res.status(400).json({ success: false, message: 'Code déjà vérifié pour cette commande — livraison confirmée' });
    return;
  }

  const otpSettings = await getOtpSettings();
  const otpCode = generateOtpCode();

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      otpCode,
      otpExpiresAt: new Date(Date.now() + otpSettings.expirySeconds * 1000),
      otpAttempts: 0,
      otpVerifiedAt: null,
    },
  });

  res.json({
    success: true,
    message: 'Code OTP généré',
    data: { orderId: updated.id, otpCode, otpExpiresAt: updated.otpExpiresAt },
  });
});

/** POST /api/orders/:id/verify-otp (livreur) */
router.post('/:id/verify-otp', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  const isDelivery = role === 'DRIVER' || role === 'DELIVERY_ADMIN' || role === 'DELIVERY_USER';
  if (!isDelivery && role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Seul le livreur peut vérifier le code OTP' });
    return;
  }

  const { otpCode } = req.body;
  if (!otpCode) {
    res.status(400).json({ success: false, message: 'Code OTP requis' });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { delivery: true },
  });
  if (!order) {
    res.status(404).json({ success: false, message: 'Commande non trouvée' });
    return;
  }

  // Le livreur doit appartenir à l'entreprise de livraison assignée à la commande
  if (isDelivery) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { deliveryCompanyId: true },
    });
    const assignedCompanyId = order.delivery?.deliveryCompanyId;
    if (!user?.deliveryCompanyId || !assignedCompanyId || user.deliveryCompanyId !== assignedCompanyId) {
      res.status(403).json({ success: false, message: 'Cette mission ne vous est pas assignée' });
      return;
    }
  }

  if (!order.otpCode) {
    res.status(400).json({ success: false, message: 'Aucun code OTP généré pour cette commande' });
    return;
  }
  if (order.otpVerifiedAt) {
    res.status(400).json({ success: false, message: 'Code déjà vérifié pour cette commande' });
    return;
  }

  const otpSettings = await getOtpSettings();

  if (order.otpExpiresAt && new Date(order.otpExpiresAt) < new Date()) {
    res.status(400).json({ success: false, message: 'Code expiré — demandez un nouveau code à la pharmacie' });
    return;
  }
  if (order.otpAttempts >= otpSettings.maxAttempts) {
    res.status(400).json({ success: false, message: 'Trop de tentatives — demandez un nouveau code à la pharmacie' });
    return;
  }

  if (order.otpCode !== String(otpCode).trim()) {
    const attempts = order.otpAttempts + 1;
    await prisma.order.update({ where: { id: order.id }, data: { otpAttempts: attempts } });
    const remaining = Math.max(0, otpSettings.maxAttempts - attempts);
    res.status(400).json({ success: false, message: `Code incorrect — il vous reste ${remaining} tentative(s)` });
    return;
  }

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        otpVerifiedAt: now,
        deliveryStatus: 'DELIVERED',
        orderStatus: 'DELIVERED',
      },
    });

    // Mettre à jour la livraison liée
    await tx.delivery.updateMany({
      where: { orderId: order.id },
      data: { status: 'DELIVERED', deliveredAt: now },
    });

    // Notifier la pharmacie
    const pharmacyUsers = await tx.pharmacy.findUnique({
      where: { id: order.pharmacyId },
      select: { users: { select: { id: true } } },
    });
    if (pharmacyUsers?.users) {
      await tx.notification.createMany({
        data: pharmacyUsers.users.map((u) => ({
          userId: u.id,
          type: 'DELIVERY_STATUS_UPDATE' as const,
          title: 'Livraison confirmée',
          message: `La livraison de la commande #${order.reference} a été confirmée par OTP`,
          payload: { orderId: order.id },
        })),
      });
    }

    return updated;
  });

  res.json({ success: true, message: 'Code vérifié — livraison confirmée', data: result });
});

/** PATCH /api/orders/:id/status */
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  const { orderStatus, deliveryStatus } = req.body;
  const targetOrderStatus = orderStatus ? String(orderStatus).toUpperCase() : undefined;
  const targetDeliveryStatus = deliveryStatus ? String(deliveryStatus).toUpperCase() : undefined;
  const wantsDelivered = targetOrderStatus === 'DELIVERED' || targetOrderStatus === 'COMPLETED' || targetDeliveryStatus === 'DELIVERED';

  // La confirmation de livraison nécessite un OTP vérifié (sauf admin)
  if (wantsDelivered && req.user!.role !== 'SUPER_ADMIN') {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: { otpVerifiedAt: true },
    });
    if (!order) {
      res.status(404).json({ success: false, message: 'Commande non trouvée' });
      return;
    }
    if (!order.otpVerifiedAt) {
      res.status(400).json({ success: false, message: 'La livraison nécessite la vérification du code OTP' });
      return;
    }
  }

  const data: any = {};
  if (targetOrderStatus) data.orderStatus = targetOrderStatus;
  if (targetDeliveryStatus) data.deliveryStatus = targetDeliveryStatus;

  if (data.orderStatus === 'DELIVERED' || data.orderStatus === 'COMPLETED') {
    data.deliveryStatus = 'DELIVERED';
  }

  const updated = await prisma.order.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: updated });
});

export default router;
