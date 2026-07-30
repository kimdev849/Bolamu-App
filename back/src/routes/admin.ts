import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/** GET /api/admin/stats */
router.get('/stats', requireAuth, requireRole('SUPER_ADMIN'), async (_req: Request, res: Response) => {
  const [
    totalPharmacies, activePharmacies,
    totalWholesalers,
    totalDeliveryCompanies,
    totalOrders, pendingOrders,
    totalRequests, searchingRequests,
  ] = await Promise.all([
    prisma.pharmacy.count(),
    prisma.pharmacy.count({ where: { isActive: true } }),
    prisma.wholesaler.count(),
    prisma.deliveryCompany.count(),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: { in: ['CREATED', 'CONFIRMED', 'PAID'] } } }),
    prisma.request.count(),
    prisma.request.count({ where: { status: 'SEARCHING' } }),
  ]);

  res.json({
    success: true,
    data: {
      totalPharmacies, activePharmacies,
      totalWholesalers,
      totalDeliveryCompanies,
      totalOrders, pendingOrders,
      totalRequests, searchingRequests,
    },
  });
});

/** GET /api/admin/pharmacies */
router.get('/pharmacies', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.pharmacy.findMany({
      skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { email: true, status: true } },
        city: { select: { name: true } },
        zone: { select: { name: true } },
      },
    }),
    prisma.pharmacy.count(),
  ]);

  res.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/admin/pharmacies/:id */
router.get('/pharmacies/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { id: req.params.id },
    include: {
      users: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
      city: { select: { name: true } },
      zone: { select: { name: true } },
      requests: { orderBy: { createdAt: 'desc' }, take: 10 },
      orders: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!pharmacy) {
    res.status(404).json({ success: false, message: 'Pharmacie non trouvée' });
    return;
  }

  res.json({ success: true, data: pharmacy });
});

/** GET /api/admin/wholesalers */
router.get('/wholesalers', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.wholesaler.findMany({
      skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { email: true, status: true } },
        city: { select: { name: true } },
      },
    }),
    prisma.wholesaler.count(),
  ]);

  res.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/admin/wholesalers/:id */
router.get('/wholesalers/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const wholesaler = await prisma.wholesaler.findUnique({
    where: { id: req.params.id },
    include: {
      users: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
      city: { select: { name: true } },
      orders: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!wholesaler) {
    res.status(404).json({ success: false, message: 'Grossiste non trouvé' });
    return;
  }

  res.json({ success: true, data: wholesaler });
});

/** GET /api/admin/delivery-companies */
router.get('/delivery-companies', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.deliveryCompany.findMany({
      skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { email: true, status: true } },
        city: { select: { name: true } },
        _count: { select: { agents: true } },
      },
    }),
    prisma.deliveryCompany.count(),
  ]);

  res.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/admin/delivery-companies/:id */
router.get('/delivery-companies/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const company = await prisma.deliveryCompany.findUnique({
    where: { id: req.params.id },
    include: {
      users: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
      city: { select: { name: true } },
      agents: true,
      deliveries: { include: { order: { select: { id: true, reference: true, totalAmount: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!company) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }

  res.json({ success: true, data: company });
});

/** GET /api/admin/delivery-fees */
router.get('/delivery-fees', requireAuth, requireRole('SUPER_ADMIN'), async (_req: Request, res: Response) => {
  const fees = await prisma.deliveryFee.findMany({
    orderBy: { zone: { name: 'asc' } },
    include: { zone: { include: { city: { select: { name: true } } } } },
  });
  res.json({ success: true, data: fees });
});

/** POST /api/admin/pharmacies — Créer une pharmacie (admin) */
router.post('/pharmacies', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { name, email, phone, address, city, zone, licenseNumber, contactName } = req.body;

  if (!name || !email || !phone || !address) {
    res.status(400).json({ success: false, message: 'Champs requis : name, email, phone, address' });
    return;
  }

  // Trouver ou créer la ville
  let cityRecord = await prisma.city.findFirst({ where: { name: city || 'Brazzaville' } });
  if (!cityRecord) {
    const country = await prisma.country.findFirst();
    if (!country) {
      res.status(400).json({ success: false, message: 'Aucun pays configuré' });
      return;
    }
    cityRecord = await prisma.city.create({
      data: { name: city || 'Brazzaville', code: city?.substring(0, 3).toUpperCase() || 'BZV', countryId: country.id },
    });
  }

  // Vérifier email unique
  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) {
    res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    return;
  }

  const tempPassword = 'Bolamu@242';
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const pharmacy = await tx.pharmacy.create({
      data: {
        name,
        registration: `REG-PH-${Date.now()}`,
        licenseNumber: licenseNumber || null,
        address,
        phone,
        email,
        contactName: contactName || name,
        contactPhone: phone,
        cityId: cityRecord!.id,
        isActive: true,
        isVerified: true,
      },
    });

    await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: name.split(' ')[0] || 'Pharmacien',
        lastName: name.split(' ').slice(1).join(' ') || name,
        phone,
        role: 'PHARMACY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        pharmacyId: pharmacy.id,
      },
    });

    return pharmacy;
  });

  res.status(201).json({
    success: true,
    message: 'Pharmacie créée avec succès',
    data: { ...result, tempPassword },
  });
});

/** POST /api/admin/wholesalers — Créer un grossiste (admin) */
router.post('/wholesalers', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { name, email, phone, address, city, licenseNumber, contactName } = req.body;

  if (!name || !email || !phone || !address) {
    res.status(400).json({ success: false, message: 'Champs requis : name, email, phone, address' });
    return;
  }

  let cityRecord = await prisma.city.findFirst({ where: { name: city || 'Brazzaville' } });
  if (!cityRecord) {
    const country = await prisma.country.findFirst();
    if (!country) {
      res.status(400).json({ success: false, message: 'Aucun pays configuré' });
      return;
    }
    cityRecord = await prisma.city.create({
      data: { name: city || 'Brazzaville', code: city?.substring(0, 3).toUpperCase() || 'BZV', countryId: country.id },
    });
  }

  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) {
    res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    return;
  }

  const tempPassword = 'Bolamu@242';
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const wholesaler = await tx.wholesaler.create({
      data: {
        name,
        registration: `REG-WH-${Date.now()}`,
        licenseNumber: licenseNumber || null,
        address,
        phone,
        email,
        contactName: contactName || name,
        contactPhone: phone,
        cityId: cityRecord!.id,
        isActive: true,
        isVerified: true,
      },
    });

    await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: name.split(' ')[0] || 'Grossiste',
        lastName: name.split(' ').slice(1).join(' ') || name,
        phone,
        role: 'WHOLESALER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        wholesalerId: wholesaler.id,
      },
    });

    return wholesaler;
  });

  res.status(201).json({
    success: true,
    message: 'Grossiste créé avec succès',
    data: { ...result, tempPassword },
  });
});

/** POST /api/admin/delivery-companies — Créer une entreprise de livraison (admin) */
router.post('/delivery-companies', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { name, email, phone, address, city, contactName } = req.body;

  if (!name || !email || !phone || !address) {
    res.status(400).json({ success: false, message: 'Champs requis : name, email, phone, address' });
    return;
  }

  let cityRecord = await prisma.city.findFirst({ where: { name: city || 'Brazzaville' } });
  if (!cityRecord) {
    const country = await prisma.country.findFirst();
    if (!country) {
      res.status(400).json({ success: false, message: 'Aucun pays configuré' });
      return;
    }
    cityRecord = await prisma.city.create({
      data: { name: city || 'Brazzaville', code: city?.substring(0, 3).toUpperCase() || 'BZV', countryId: country.id },
    });
  }

  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) {
    res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    return;
  }

  const tempPassword = 'Bolamu@242';
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.deliveryCompany.create({
      data: {
        name,
        registration: `REG-DC-${Date.now()}`,
        address,
        phone,
        email,
        contactName: contactName || name,
        cityId: cityRecord!.id,
        isActive: true,
        isVerified: true,
      },
    });

    await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: name.split(' ')[0] || 'Transport',
        lastName: name.split(' ').slice(1).join(' ') || name,
        phone,
        role: 'DELIVERY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        deliveryCompanyId: company.id,
      },
    });

    return company;
  });

  res.status(201).json({
    success: true,
    message: 'Entreprise de livraison créée avec succès',
    data: { ...result, tempPassword },
  });
});

/** PUT /api/admin/delivery-fees/:id */
router.put('/delivery-fees/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { baseAmount, expressAmount, thermoAmount } = req.body;
  const data: any = {};
  if (baseAmount !== undefined) data.baseAmount = baseAmount;
  if (expressAmount !== undefined) data.expressAmount = expressAmount;
  if (thermoAmount !== undefined) data.thermoAmount = thermoAmount;

  const fee = await prisma.deliveryFee.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: fee });
});

// ───── PARAMÈTRES SYSTÈME ─────

const SETTING_DEFAULTS: Record<string, string> = {
  commission_percent: '10',
  commission_flat: '0',
  subscription_basic_price: '25000',
  subscription_premium_price: '50000',
  subscription_enterprise_price: '100000',
  request_expiry_minutes: '30',
  platform_name: 'Bolamu',
  support_email: 'contact@bolamu.cg',
  support_phone: '+242 05 555 55 55',
};

/** GET /api/admin/settings */
router.get('/settings', requireAuth, requireRole('SUPER_ADMIN'), async (_req: Request, res: Response) => {
  const dbSettings = await prisma.systemSetting.findMany({
    where: { key: { in: Object.keys(SETTING_DEFAULTS) } },
  });

  // Fusionner avec les defaults (ceux pas encore en DB)
  const settingsMap: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const s of dbSettings) {
    settingsMap[s.key] = s.value;
  }

  res.json({ success: true, data: settingsMap });
});

/** PUT /api/admin/settings */
router.put('/settings', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;
  const allowedKeys = Object.keys(SETTING_DEFAULTS);

  // Lire les anciennes valeurs AVANT les upsert
  const oldSettings = await prisma.systemSetting.findMany({
    where: { key: { in: allowedKeys } },
  });
  const oldMap: Record<string, string> = {};
  for (const s of oldSettings) oldMap[s.key] = s.value;

  const results: Record<string, string> = {};

  // Upsert des nouvelles valeurs
  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) continue;

    await prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: String(value),
        type: typeof value === 'number' ? 'number' : 'string',
        description: SETTING_DEFAULTS[key] ? `Configuration: ${key}` : null,
      },
      update: { value: String(value) },
    });

    results[key] = String(value);
  }

  // Notifier les pharmacies si les prix ont changé
  const priceKeys = ['subscription_basic_price', 'subscription_premium_price', 'subscription_enterprise_price'];
  const hasPriceChange = priceKeys.some((k) => updates[k] && updates[k] !== oldMap[k]);

  if (hasPriceChange) {
    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIAL'] },
        pharmacy: { isActive: true },
      },
      include: {
        pharmacy: {
          select: { users: { select: { id: true } } },
        },
      },
    });

    const notifications: any[] = [];
    for (const sub of activeSubs) {
      const planKey = sub.plan === 'BASIC' ? 'subscription_basic_price'
        : sub.plan === 'PRO' ? 'subscription_premium_price'
        : sub.plan === 'ENTERPRISE' ? 'subscription_enterprise_price'
        : null;

      if (planKey && updates[planKey] && updates[planKey] !== oldMap[planKey]) {
        for (const user of sub.pharmacy.users) {
          notifications.push({
            userId: user.id,
            type: 'SYSTEM' as const,
            title: 'Mise à jour des tarifs',
            message: `Le prix de votre formule d'abonnement a été mis à jour : ${updates[planKey]} FCFA/mois.`,
            payload: { action: 'price_update', plan: sub.plan, oldPrice: oldMap[planKey], newPrice: updates[planKey] },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  }

  res.json({ success: true, message: 'Paramètres enregistrés', data: results });
});

export default router;
