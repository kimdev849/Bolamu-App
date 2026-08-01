import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** Génère un mot de passe temporaire lisible (8 caractères) */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += chars[bytes[i] % chars.length];
  return pwd;
}

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

  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName || !lastName || !phone) {
    res.status(400).json({ success: false, message: 'Champs requis : firstName, lastName, phone' });
    return;
  }

  // Mot de passe : celui saisi par l'entreprise (>= 6 car.), sinon généré automatiquement
  let tempPassword: string;
  if (password !== undefined && password !== null && String(password) !== '') {
    if (String(password).length < 6) {
      res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }
    tempPassword = String(password);
  } else {
    tempPassword = generateTempPassword();
  }

  const companyId = user.deliveryCompanyId;

  // Email généré à partir du nom (sans accents) si non fourni
  const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const driverEmail = (email || `${slug(firstName)}.${slug(lastName)}@delivery.cg`).toLowerCase();

  // Unicité de l'email — un compte existe déjà
  const existing = await prisma.user.findUnique({ where: { email: driverEmail } });
  if (existing) {
    res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet email' });
    return;
  }

  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Créer l'agent ET son compte de connexion dans une transaction (pas d'agent orphelin)
  let agent;
  try {
    agent = await prisma.$transaction(async (tx) => {
      const created = await tx.deliveryAgent.create({
        data: {
          firstName,
          lastName,
          email: email || null,
          phone,
          deliveryCompanyId: companyId,
        },
      });

      // Compte utilisateur lié (role DRIVER) — l'agent se connectera avec ces identifiants
      await tx.user.create({
        data: {
          email: driverEmail,
          password: hashedPassword,
          firstName, lastName, phone,
          role: 'DRIVER',
          status: 'ACTIVE',
          deliveryAgentId: created.id,
          deliveryCompanyId: companyId,
        },
      });

      return created;
    });
  } catch (e: any) {
    // Contrainte d'unicité (email ou téléphone déjà utilisé) — P2002
    if (e?.code === 'P2002') {
      // meta.target peut être une string ou un tableau selon le connecteur
      const raw = e?.meta?.target;
      const target = Array.isArray(raw) ? raw : [raw].filter(Boolean);
      const onPhone = target.some((t) => String(t).toLowerCase().includes('phone'));
      const onEmail = target.some((t) => String(t).toLowerCase().includes('email'));
      const field = onPhone ? 'ce numéro de téléphone' : onEmail ? 'cet email' : 'ces identifiants';
      res.status(409).json({ success: false, message: `Un agent ou un compte existe déjà avec ${field}` });
      return;
    }
    throw e;
  }

  res.status(201).json({
    success: true,
    data: agent,
    // Identifiants à transmettre à l'agent — retournés UNE fois à la création
    credentials: { email: driverEmail, password: tempPassword },
  });
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

  const newStatus = !agent.isActive;

  const updated = await prisma.deliveryAgent.update({
    where: { id: agent.id },
    data: { isActive: newStatus },
  });

  // Synchroniser le compte utilisateur lié : un agent désactivé ne peut plus se connecter
  await prisma.user.updateMany({
    where: { deliveryAgentId: agent.id },
    data: { status: newStatus ? 'ACTIVE' : 'INACTIVE' },
  });

  res.json({ success: true, data: updated });
});

export default router;
