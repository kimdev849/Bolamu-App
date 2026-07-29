import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt';
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

/** POST /api/auth/forgot-password */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email requis' });
    return;
  }

  // On ne révèle pas si l'email existe ou non (sécurité)
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    // En MVP, on loggue le token (en production, envoyer par email)
    console.log(`\n  🔑  Reset token pour ${email}: ${token}`);
    console.log(`  🔗  http://localhost:4200/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}\n`);
  }

  // Toujours retourner le même message (sécurité)
  res.json({
    success: true,
    message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation sous peu.',
  });
});

/** POST /api/auth/reset-password */
router.post('/reset-password', async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    res.status(400).json({ success: false, message: 'Email, token et nouveau mot de passe requis' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
    return;
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { email, token, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!resetToken) {
    res.status(400).json({ success: false, message: 'Lien invalide ou expiré' });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { password: hashedPassword } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  res.json({ success: true, message: 'Mot de passe réinitialisé avec succès. Connectez-vous avec votre nouveau mot de passe.' });
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

/** POST /api/auth/register — Inscription publique (création simple, sans entité liée) */
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ success: false, message: 'Champs requis : email, password, firstName, lastName' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email, password: hashedPassword, firstName, lastName, phone: phone || null,
      role: 'PHARMACY_USER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const payload = { userId: user.id, email: user.email, role: user.role };

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès',
    data: {
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role,
      },
      tokens: {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
      },
    },
  });
});

/** POST /api/auth/refresh — Rafraîchir le token */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token requis' });
    return;
  }

  try {
    const decoded = verifyToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ success: false, message: 'Compte inactif ou inexistant' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    res.json({
      success: true,
      data: {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
      },
    });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré' });
  }
});

/** POST /api/auth/logout */
router.post('/logout', requireAuth, async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
});

export default router;
