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

export default router;
