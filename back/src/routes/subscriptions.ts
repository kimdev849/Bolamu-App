import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();

const SUBSCRIPTION_PLANS = {
  BASIC: { name: 'Essentiel', price: 25000, requestsPerMonth: 10, features: ['10 demandes/mois', 'Support email', 'Dashboard de base'] },
  PREMIUM: { name: 'Professionnel', price: 50000, requestsPerMonth: -1, features: ['Demandes illimitées', 'Support prioritaire', 'Statistiques avancées', 'API accessible'] },
  ENTERPRISE: { name: 'Enterprise', price: 100000, requestsPerMonth: -1, features: ['Tout illimité', 'Support dédié 24/7', 'Rapports personnalisés', 'SLA garanti'] },
};

/** GET /api/subscriptions/plans — Liste des plans disponibles */
router.get('/plans', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
    })),
  });
});

/** GET /api/subscriptions/my — Abonnement de la pharmacie connectée */
router.get('/my', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  const isPharmacy = role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';

  if (!isPharmacy) {
    res.status(403).json({ success: false, message: 'Seules les pharmacies ont un abonnement' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { pharmacyId: true },
  });

  if (!user?.pharmacyId) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  let subscription = await prisma.subscription.findUnique({
    where: { pharmacyId: user.pharmacyId },
  });

  if (!subscription) {
    // Créer un abonnement TRIAL par défaut
    subscription = await prisma.subscription.create({
      data: {
        pharmacyId: user.pharmacyId,
        plan: 'BASIC',
        price: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours d'essai
        status: 'TRIAL',
      },
    });
  }

  const plan = SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS];

  res.json({
    success: true,
    data: {
      ...subscription,
      price: Number(subscription.price),
      planName: plan?.name || subscription.plan,
      planFeatures: plan?.features || [],
      requestsPerMonth: plan?.requestsPerMonth || 10,
      daysLeft: Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    },
  });
});

/** POST /api/subscriptions/subscribe — Changer/souscrire à un abonnement */
router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  const isPharmacy = role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';

  if (!isPharmacy) {
    res.status(403).json({ success: false, message: 'Seules les pharmacies peuvent souscrire' });
    return;
  }

  const { planId } = req.body;
  if (!planId || !SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
    res.status(400).json({ success: false, message: 'Plan invalide' });
    return;
  }

  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { pharmacyId: true },
  });

  if (!user?.pharmacyId) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  const existing = await prisma.subscription.findUnique({
    where: { pharmacyId: user.pharmacyId },
  });

  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let subscription;
  if (existing) {
    subscription = await prisma.subscription.update({
      where: { pharmacyId: user.pharmacyId },
      data: {
        plan: planId as any,
        price: plan.price,
        startDate,
        endDate,
        status: 'ACTIVE',
        lastPaymentAt: new Date(),
        nextPaymentAt: endDate,
      },
    });
  } else {
    subscription = await prisma.subscription.create({
      data: {
        pharmacyId: user.pharmacyId,
        plan: planId as any,
        price: plan.price,
        startDate,
        endDate,
        status: 'ACTIVE',
        lastPaymentAt: new Date(),
        nextPaymentAt: endDate,
      },
    });
  }

  res.json({ success: true, message: `Abonnement ${plan.name} activé avec succès`, data: { ...subscription, price: Number(subscription.price) } });
});

/** POST /api/subscriptions/cancel — Annuler l'abonnement */
router.post('/cancel', requireAuth, async (req: Request, res: Response) => {
  const role = req.user!.role;
  const isPharmacy = role === 'PHARMACY_ADMIN' || role === 'PHARMACY_USER';

  if (!isPharmacy) {
    res.status(403).json({ success: false, message: 'Non autorisé' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { pharmacyId: true },
  });

  if (!user?.pharmacyId) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  await prisma.subscription.updateMany({
    where: { pharmacyId: user.pharmacyId },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true, message: 'Abonnement annulé. Vous pourrez le réactiver à tout moment.' });
});

/** GET /api/subscriptions/admin — Liste tous les abonnements (admin) */
router.get('/admin', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    return;
  }

  const subscriptions = await prisma.subscription.findMany({
    include: {
      pharmacy: {
        select: { id: true, name: true, email: true, phone: true, isActive: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = subscriptions.map((sub) => ({
    ...sub,
    price: Number(sub.price),
    planName: SUBSCRIPTION_PLANS[sub.plan as keyof typeof SUBSCRIPTION_PLANS]?.name || sub.plan,
    pharmacyName: sub.pharmacy.name,
  }));

  res.json({ success: true, data: formatted });
});

/** PATCH /api/subscriptions/admin/:id — Changer le plan d'un abonnement (admin) */
router.patch('/admin/:id', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    return;
  }

  const { planId, status } = req.body;
  const data: any = {};

  if (planId) {
    if (!SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
      res.status(400).json({ success: false, message: 'Plan invalide' });
      return;
    }
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    data.plan = planId;
    data.price = plan.price;
  }

  if (status) {
    const validStatuses = ['TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Statut invalide' });
      return;
    }
    data.status = status;
  }

  const subscription = await prisma.subscription.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ success: true, message: 'Abonnement mis à jour', data: { ...subscription, price: Number(subscription.price) } });
});

/** POST /api/subscriptions/admin — Créer un abonnement pour une pharmacie (admin) */
router.post('/admin', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    return;
  }

  const { pharmacyId, planId } = req.body;
  if (!pharmacyId || !planId) {
    res.status(400).json({ success: false, message: 'pharmacyId et planId requis' });
    return;
  }

  if (!SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
    res.status(400).json({ success: false, message: 'Plan invalide' });
    return;
  }

  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
  if (!pharmacy) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
  const existing = await prisma.subscription.findUnique({ where: { pharmacyId } });

  if (existing) {
    res.status(409).json({ success: false, message: 'Cette pharmacie a déjà un abonnement' });
    return;
  }

  const subscription = await prisma.subscription.create({
    data: {
      pharmacyId,
      plan: planId as any,
      price: plan.price,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      lastPaymentAt: new Date(),
      nextPaymentAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({ success: true, message: 'Abonnement créé avec succès', data: { ...subscription, price: Number(subscription.price) } });
});

export default router;
