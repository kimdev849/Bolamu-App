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

/** Slug sans accents ni caractères spéciaux (pour générer un email) */
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

/** Email de connexion dérivé : celui fourni, sinon généré à partir du nom */
const deriveDriverEmail = (email: string | undefined | null, firstName: string, lastName: string) =>
  ((email && email.trim()) || `${slug(firstName)}.${slug(lastName)}@delivery.cg`).toLowerCase();

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
  }

  const agents = await prisma.deliveryAgent.findMany({
    where: { deliveryCompanyId: user.deliveryCompanyId },
    include: { user: { select: { email: true } } }, // email réel du compte de connexion
    orderBy: { createdAt: 'desc' },
  });

  // Expose loginEmail (email de connexion effectif) et retire l'objet user de la réponse
  // (pas de fuite du mot de passe haché). Tous les autres champs de l'agent sont préservés.
  const data = agents.map((a: any) => {
    const { user, ...rest } = a;
    return { ...rest, loginEmail: user?.email || a.email };
  });

  res.json({ success: true, data });
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
  const driverEmail = deriveDriverEmail(email, firstName, lastName);

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

/** PATCH /api/delivery-companies/agents/:id — Modifier un agent (nom, email, téléphone) */
router.patch('/agents/:id', requireAuth, async (req: Request, res: Response) => {
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

  const { firstName, lastName, email, phone } = req.body;
  const hasChanges =
    firstName !== undefined || lastName !== undefined || email !== undefined || phone !== undefined;
  if (!hasChanges) {
    res.status(400).json({ success: false, message: 'Aucune modification fournie' });
    return;
  }

  // Email de connexion (compte user) dérivé comme à la création
  const driverEmail = deriveDriverEmail(email, firstName ?? agent.firstName, lastName ?? agent.lastName);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.deliveryAgent.update({
        where: { id: agent.id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email: email || null }),
          ...(phone !== undefined && { phone }),
        },
      });

      // Synchroniser le compte de connexion lié (email, nom, téléphone)
      await tx.user.updateMany({
        where: { deliveryAgentId: agent.id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email: driverEmail }),
        },
      });

      return up;
    });

    res.json({ success: true, data: updated });
  } catch (e: any) {
    if (e?.code === 'P2002') {
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
});

/** POST /api/delivery-companies/agents/:id/reset-password — Réinitialiser le mot de passe d'un agent */
router.post('/agents/:id/reset-password', requireAuth, async (req: Request, res: Response) => {
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

  const { password } = req.body;
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

  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const account = await prisma.user.findUnique({
    where: { deliveryAgentId: agent.id },
    select: { id: true, email: true },
  });

  if (!account) {
    res.status(400).json({ success: false, message: 'Aucun compte de connexion associé à ce livreur' });
    return;
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { password: hashedPassword },
  });

  res.json({
    success: true,
    credentials: { email: account.email, password: tempPassword },
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
