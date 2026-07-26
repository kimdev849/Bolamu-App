import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();

/** POST /api/auth/login */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      pharmacy: { select: { id: true, name: true } },
      wholesaler: { select: { id: true, name: true } },
      deliveryCompany: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({ success: false, message: 'Compte désactivé. Contactez l\'administrateur.' });
    return;
  }

  const payload = { userId: user.id, email: user.email, role: user.role };

  // Profil lié
  const profile = user.pharmacy || user.wholesaler || user.deliveryCompany || null;

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        status: user.status,
        profile: profile ? { id: profile.id, name: (profile as any).name } : null,
      },
      tokens: {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
      },
    },
  });
});

/** GET /api/auth/me */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      pharmacy: { select: { id: true, name: true, cityId: true, isVerified: true } },
      wholesaler: { select: { id: true, name: true, cityId: true, isVerified: true } },
      deliveryCompany: { select: { id: true, name: true, cityId: true } },
      deliveryAgent: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    return;
  }

  const profile = user.pharmacy || user.wholesaler || user.deliveryCompany || user.deliveryAgent || null;

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      profile,
    },
  });
});

/** POST /api/auth/change-password */
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau requis' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });

  res.json({ success: true, message: 'Mot de passe changé avec succès' });
});

export default router;
