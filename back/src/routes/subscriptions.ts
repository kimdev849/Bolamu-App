import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

async function getPrices() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['subscription_basic_price', 'subscription_premium_price', 'subscription_enterprise_price'] } },
  });
  const map: Record<string, number> = {
    BASIC: 25000,
    PREMIUM: 50000,
    ENTERPRISE: 100000,
  };
  for (const s of settings) {
    if (s.key === 'subscription_basic_price') map.BASIC = parseInt(s.value) || 25000;
    if (s.key === 'subscription_premium_price') map.PREMIUM = parseInt(s.value) || 50000;
    if (s.key === 'subscription_enterprise_price') map.ENTERPRISE = parseInt(s.value) || 100000;
  }
  return map;
}

async function getPlans() {
  const prices = await getPrices();
  return {
    BASIC: { name: 'Essentiel', price: prices.BASIC, requestsPerMonth: 10, features: ['10 demandes/mois', 'Support email', 'Dashboard de base'] },
    PREMIUM: { name: 'Professionnel', price: prices.PREMIUM, requestsPerMonth: -1, features: ['Demandes illimitées', 'Support prioritaire', 'Statistiques avancées', 'API accessible'] },
    ENTERPRISE: { name: 'Enterprise', price: prices.ENTERPRISE, requestsPerMonth: -1, features: ['Tout illimité', 'Support dédié 24/7', 'Rapports personnalisés', 'SLA garanti'] },
  };
}

/** GET /api/subscriptions/plans — Liste des plans disponibles (prix depuis la DB) */
router.get('/plans', async (_req: Request, res: Response) => {
  const plans = await getPlans();
  res.json({
    success: true,
    data: Object.entries(plans).map(([key, plan]) => ({
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

  const plans = await getPlans();

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

  const plan = plans[subscription.plan as keyof typeof plans];

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
  const plans = await getPlans();

  if (!planId || !plans[planId as keyof typeof plans]) {
    res.status(400).json({ success: false, message: 'Plan invalide' });
    return;
  }

  const plan = plans[planId as keyof typeof plans];

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

  const [subscriptions, plans] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        pharmacy: {
          select: { id: true, name: true, email: true, phone: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getPlans(),
  ]);

  const formatted = subscriptions.map((sub) => ({
    ...sub,
    price: Number(sub.price),
    planName: plans[sub.plan as keyof typeof plans]?.name || sub.plan,
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
  const plans = await getPlans();

  if (planId) {
    if (!plans[planId as keyof typeof plans]) {
      res.status(400).json({ success: false, message: 'Plan invalide' });
      return;
    }
    const plan = plans[planId as keyof typeof plans];
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

  const plans = await getPlans();

  if (!plans[planId as keyof typeof plans]) {
    res.status(400).json({ success: false, message: 'Plan invalide' });
    return;
  }

  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
  if (!pharmacy) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  const plan = plans[planId as keyof typeof plans];
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
