import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'psr-pharmaflow-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@psr.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
  app: {
    name: 'Bolamu',
    currency: 'FCFA',
    commissionPercent: 0,
    commissionFlat: 0,
    requestExpiryMinutes: 30,
  },
  deliveryFees: {
    Douala: { standard: 1500, express: 2500, thermos: 3000 },
    Yaoundé: { standard: 1500, express: 2500, thermos: 3000 },
    Brazzaville: { standard: 1000, express: 2000, thermos: 2500 },
    'Pointe-Noire': { standard: 1500, express: 2500, thermos: 3000 },
    Bafoussam: { standard: 1500, express: 2500, thermos: 3000 },
    Garoua: { standard: 2000, express: 3000, thermos: 3500 },
    Dolisie: { standard: 2000, express: 3000, thermos: 3500 },
    Ouesso: { standard: 2500, express: 3500, thermos: 4000 },
    Mbalmayo: { standard: 1500, express: 2500, thermos: 3000 },
    Dschang: { standard: 1500, express: 2500, thermos: 3000 },
    Mbouda: { standard: 1500, express: 2500, thermos: 3000 },
  } as Record<string, { standard: number; express: number; thermos: number }>,
  defaultDeliveryFee: 2000,
};

export function getDeliveryFee(city: string): number {
  return config.deliveryFees[city]?.standard ?? config.defaultDeliveryFee;
}

export function getCommission(productTotal: number): number {
  return Math.round(productTotal * config.app.commissionPercent / 100) + config.app.commissionFlat;
}
