import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/** POST /api/onboarding — Soumission publique d'une demande d'accès */
router.post('/', async (req: Request, res: Response) => {
  const { entityType, entityName, email, phone, city, licenseNumber, documentUrl, notes } = req.body;

  if (!entityType || !entityName || !email || !phone || !city) {
    res.status(400).json({
      success: false,
      message: 'Champs requis : entityType, entityName, email, phone, city',
    });
    return;
  }

  if (!['pharmacy', 'wholesaler', 'delivery_company'].includes(entityType)) {
    res.status(400).json({ success: false, message: 'Type d\'entité invalide' });
    return;
  }

  // Vérifier si l'email existe déjà comme utilisateur ou demande
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ success: false, message: 'Cet email est déjà utilisé sur la plateforme' });
    return;
  }

  const existingRequest = await prisma.onboardingRequest.findFirst({
    where: { email, status: { in: ['PENDING', 'CONTACTED', 'APPROVED'] } },
  });
  if (existingRequest) {
    res.status(409).json({ success: false, message: 'Une demande est déjà en cours pour cet email' });
    return;
  }

  const request = await prisma.onboardingRequest.create({
    data: { entityType, entityName, email, phone, city, licenseNumber, documentUrl, notes },
  });

  res.status(201).json({
    success: true,
    message: 'Votre demande a été soumise avec succès. L\'équipe de Bolamu vous contactera sous 48h.',
    data: request,
  });
});

/** GET /api/onboarding — Liste des demandes (admin uniquement) */
router.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: any = {};
  if (status && status !== 'all') where.status = (status as string).toUpperCase();

  const data = await prisma.onboardingRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data });
});

/** GET /api/onboarding/:id */
router.get('/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const request = await prisma.onboardingRequest.findUnique({ where: { id: req.params.id } });
  if (!request) {
    res.status(404).json({ success: false, message: 'Demande non trouvée' });
    return;
  }
  res.json({ success: true, data: request });
});

/** PATCH /api/onboarding/:id/approve — Approuver une demande ET créer l'entité + l'utilisateur */
router.patch('/:id/approve', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const request = await prisma.onboardingRequest.findUnique({ where: { id: req.params.id } });
  if (!request) {
    res.status(404).json({ success: false, message: 'Demande non trouvée' });
    return;
  }
  if (request.status !== 'PENDING') {
    res.status(400).json({ success: false, message: 'Cette demande a déjà été traitée' });
    return;
  }

  // Générer un mot de passe temporaire
  const tempPassword = 'Bolamu@242';
  const hashedPassword = await (await import('bcryptjs')).hash(tempPassword, 10);

  // Trouver ou créer la ville
  let cityRecord = await prisma.city.findFirst({ where: { name: request.city } });
  if (!cityRecord) {
    const country = await prisma.country.findFirst();
    if (!country) {
      res.status(500).json({ success: false, message: 'Aucun pays configuré dans le système' });
      return;
    }
    cityRecord = await prisma.city.create({
      data: { name: request.city, code: request.city.substring(0, 3).toUpperCase(), countryId: country.id },
    });
  }

  // Créer l'entité et l'utilisateur dans une transaction
  const result = await prisma.$transaction(async (tx) => {
    let entityId: string | null = null;
    let userRole: string = 'PHARMACY_USER';

    if (request.entityType === 'pharmacy') {
      const pharmacy = await tx.pharmacy.create({
        data: {
          name: request.entityName,
          registration: `REG-PH-${Date.now()}`,
          licenseNumber: request.licenseNumber || null,
          address: request.city,
          phone: request.phone,
          email: request.email,
          contactName: request.entityName,
          isVerified: true,
          isActive: true,
          cityId: cityRecord!.id,
        },
      });
      entityId = pharmacy.id;
      userRole = 'PHARMACY_ADMIN';
    } else if (request.entityType === 'wholesaler') {
      const wholesaler = await tx.wholesaler.create({
        data: {
          name: request.entityName,
          registration: `REG-WH-${Date.now()}`,
          licenseNumber: request.licenseNumber || null,
          address: request.city,
          phone: request.phone,
          email: request.email,
          contactName: request.entityName,
          isVerified: true,
          isActive: true,
          cityId: cityRecord!.id,
        },
      });
      entityId = wholesaler.id;
      userRole = 'WHOLESALER_ADMIN';
    } else if (request.entityType === 'delivery_company') {
      const company = await tx.deliveryCompany.create({
        data: {
          name: request.entityName,
          registration: `REG-DC-${Date.now()}`,
          address: request.city,
          phone: request.phone,
          email: request.email,
          contactName: request.entityName,
          isVerified: true,
          isActive: true,
          cityId: cityRecord!.id,
        },
      });
      entityId = company.id;
      userRole = 'DELIVERY_ADMIN';
    }

    // Créer l'utilisateur
    const user = await tx.user.create({
      data: {
        email: request.email,
        password: hashedPassword,
        firstName: request.entityName.split(' ')[0] || 'Utilisateur',
        lastName: request.entityName.split(' ').slice(1).join(' ') || request.entityName,
        phone: request.phone,
        role: userRole as any,
        status: 'ACTIVE',
        emailVerified: true,
        ...(entityId && request.entityType === 'pharmacy' ? { pharmacyId: entityId } : {}),
        ...(entityId && request.entityType === 'wholesaler' ? { wholesalerId: entityId } : {}),
        ...(entityId && request.entityType === 'delivery_company' ? { deliveryCompanyId: entityId } : {}),
      },
    });

    // Marquer la demande comme approuvée
    await tx.onboardingRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', processedById: req.user!.userId, processedAt: new Date() },
    });

    return { entityId, userId: user.id, email: request.email, tempPassword };
  });

  res.json({
    success: true,
    message: 'Demande approuvée — compte créé',
    data: {
      email: result.email,
      tempPassword: result.tempPassword,
      entityId: result.entityId,
    },
  });
});

/** PATCH /api/onboarding/:id/reject */
router.patch('/:id/reject', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { reason } = req.body;
  const request = await prisma.onboardingRequest.findUnique({ where: { id: req.params.id } });
  if (!request) {
    res.status(404).json({ success: false, message: 'Demande non trouvée' });
    return;
  }
  if (request.status !== 'PENDING') {
    res.status(400).json({ success: false, message: 'Cette demande a déjà été traitée' });
    return;
  }

  const updated = await prisma.onboardingRequest.update({
    where: { id: request.id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason || null,
      processedById: req.user!.userId,
      processedAt: new Date(),
    },
  });

  res.json({ success: true, message: 'Demande rejetée', data: updated });
});

export default router;
