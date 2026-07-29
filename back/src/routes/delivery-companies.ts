import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** GET /api/delivery-companies/me */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      deliveryCompany: {
        include: {
          city: { select: { name: true } },
          agents: { where: { isActive: true } },
          _count: { select: { deliveries: true, agents: true } },
        },
      },
    },
  });

  if (!user?.deliveryCompany) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }

  res.json({ success: true, data: user.deliveryCompany });
});

/** PUT /api/delivery-companies/me */
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { deliveryCompanyId: true },
  });

  if (!user?.deliveryCompanyId) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }

  const { name, address, phone, email, contactName, coverageZones } = req.body;
  const updated = await prisma.deliveryCompany.update({
    where: { id: user.deliveryCompanyId },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(contactName !== undefined && { contactName }),
      ...(coverageZones !== undefined && { coverageZones }),
    },
  });

  res.json({ success: true, data: updated });
});

/** GET /api/delivery-companies/dashboard */
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { deliveryCompanyId: true },
  });

  if (!user?.deliveryCompanyId) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }

  const companyId = user.deliveryCompanyId;

  const deliveriesWhere = { deliveryCompanyId: companyId };
  const allCompanyOrderIds = (await prisma.delivery.findMany({
    where: { deliveryCompanyId: companyId },
    select: { orderId: true },
  })).map(d => d.orderId);

  const [totalMissions, activeMissions, totalAgents, activeAgents] = await Promise.all([
    prisma.order.count({ where: { id: { in: allCompanyOrderIds } } }),
    prisma.order.count({ where: { id: { in: allCompanyOrderIds }, orderStatus: { in: ['PAID', 'IN_PROGRESS'] } } }),
    prisma.deliveryAgent.count({ where: { deliveryCompanyId: companyId } }),
    prisma.deliveryAgent.count({ where: { deliveryCompanyId: companyId, isActive: true, isOnline: true } }),
  ]);

  res.json({
    success: true,
    data: { stats: { totalMissions, activeMissions, totalAgents, activeAgents } },
  });
});

/** GET /api/delivery-companies/agents */
router.get('/agents', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { deliveryCompanyId: true },
  });

  if (!user?.deliveryCompanyId) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }    const agents = await prisma.deliveryAgent.findMany({
    where: { deliveryCompanyId: user.deliveryCompanyId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: agents });
});

/** POST /api/delivery-companies/agents */
router.post('/agents', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { deliveryCompanyId: true },
  });

  if (!user?.deliveryCompanyId) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }

  const { firstName, lastName, email, phone } = req.body;
  if (!firstName || !lastName || !phone) {
    res.status(400).json({ success: false, message: 'Champs requis : firstName, lastName, phone' });
    return;
  }

  const agent = await prisma.deliveryAgent.create({
    data: {
      firstName,
      lastName,
      email: email || null,
      phone,
      deliveryCompanyId: user.deliveryCompanyId,
    },
  });

  // Mettre à jour le user lié
  const driverEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@delivery.cg`;
  await prisma.user.create({
    data: {
      email: driverEmail,
      password: await (await import('bcryptjs')).hash('Driver@123', 10),
      firstName, lastName, phone,
      role: 'DRIVER',
      status: 'ACTIVE',
      deliveryAgentId: agent.id,
      deliveryCompanyId: user.deliveryCompanyId,
    },
  });

  res.status(201).json({ success: true, data: agent });
});

/** PATCH /api/delivery-companies/agents/:id/toggle */
router.patch('/agents/:id/toggle', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { deliveryCompanyId: true },
  });

  if (!user?.deliveryCompanyId) {
    res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    return;
  }

  const agent = await prisma.deliveryAgent.findFirst({
    where: { id: req.params.id, deliveryCompanyId: user.deliveryCompanyId },
  });

  if (!agent) {
    res.status(404).json({ success: false, message: 'Livreur non trouvé' });
    return;
  }

  const updated = await prisma.deliveryAgent.update({
    where: { id: agent.id },
    data: { isActive: !agent.isActive },
  });

  res.json({ success: true, data: updated });
});

export default router;
