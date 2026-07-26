export const APP_NAME = 'Bolamu';
export const APP_SHORT_NAME = 'Bolamu';

export const API_BASE_URL = '/api';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'psr_access_token',
  REFRESH_TOKEN: 'psr_refresh_token',
  CURRENT_USER: 'psr_current_user',
} as const;

export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PHARMACIES: '/admin/pharmacies',
    WHOLESALERS: '/admin/wholesalers',
    DELIVERY_COMPANIES: '/admin/delivery-companies',
    ORDERS: '/admin/orders',
    COMMISSIONS: '/admin/commissions',
    SUBSCRIPTIONS: '/admin/subscriptions',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
  },
  PHARMACY: {
    DASHBOARD: '/pharmacy/dashboard',
    REQUESTS: '/pharmacy/requests',
    ORDERS: '/pharmacy/orders',
    DELIVERIES: '/pharmacy/deliveries',
    SUBSCRIPTION: '/pharmacy/subscription',
    PROFILE: '/pharmacy/profile',
  },
  WHOLESALER: {
    DASHBOARD: '/wholesaler/dashboard',
    REQUESTS: '/wholesaler/requests',
    ORDERS: '/wholesaler/orders',
    HISTORY: '/wholesaler/history',
    PROFILE: '/wholesaler/profile',
  },
  DELIVERY: {
    DASHBOARD: '/delivery/dashboard',
    MISSIONS: '/delivery/missions',
    AGENTS: '/delivery/agents',
    HISTORY: '/delivery/history',
    PROFILE: '/delivery/profile',
  },
} as const;

export const REQUEST_STATUS = {
  PENDING: 'pending',
  MATCHED: 'matched',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const URGENCY_LABELS: Record<string, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  emergency: 'Urgence',
};

export const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  emergency: 'bg-red-100 text-red-700',
};

export const STATUS_LABELS: Record<string, string> = {
  searching: 'En recherche',
  found: 'Produit trouvé',
  pending: 'En attente',
  matched: 'Correspondance trouvée',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  expired: 'Expiré',
  created: 'Créée',
  processing: 'En traitement',
  shipped: 'Expédié',
  delivered: 'Livré',
  refunded: 'Remboursé',
  assigned: 'Assigné',
  picked_up: 'Récupéré',
  in_transit: 'En transit',
  failed: 'Échoué',
  unpaid: 'Impayé',
  paid: 'Payé',
  partially_paid: 'Partiellement payé',
  active: 'Actif',
  pending_approval: 'En validation',
  suspended: 'Suspendu',
};

export const STATUS_COLORS: Record<string, string> = {
  searching: 'bg-purple-100 text-purple-700',
  found: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  matched: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-cyan-100 text-cyan-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-slate-100 text-slate-500',
  created: 'bg-blue-100 text-blue-700',
  processing: 'bg-violet-100 text-violet-700',
  shipped: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-rose-100 text-rose-700',
  active: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

/** Barème des frais de livraison par ville/zone (configuré par l'admin PSR) */
export const DELIVERY_FEES: Record<string, { standard: number; express: number; thermos: number }> = {
  'Douala': { standard: 1500, express: 2500, thermos: 3000 },
  'Yaoundé': { standard: 1500, express: 2500, thermos: 3000 },
  'Brazzaville': { standard: 1000, express: 2000, thermos: 2500 },
  'Pointe-Noire': { standard: 1500, express: 2500, thermos: 3000 },
  'Bafoussam': { standard: 1500, express: 2500, thermos: 3000 },
  'Garoua': { standard: 2000, express: 3000, thermos: 3500 },
  'Dolisie': { standard: 2000, express: 3000, thermos: 3500 },
  'Ouesso': { standard: 2500, express: 3500, thermos: 4000 },
  'Mbalmayo': { standard: 1500, express: 2500, thermos: 3000 },
  'Dschang': { standard: 1500, express: 2500, thermos: 3000 },
  'Mbouda': { standard: 1500, express: 2500, thermos: 3000 },
};

/** Frais de livraison par défaut pour les villes non répertoriées */
export const DEFAULT_DELIVERY_FEE = 2000;

/** Commission PSR (0% au lancement) */
export const COMMISSION_PERCENT = 0;
export const COMMISSION_FLAT = 0;

/**
 * Calcule les frais de livraison pour une ville donnée
 */
export function getDeliveryFee(city: string): number {
  return DELIVERY_FEES[city]?.standard ?? DEFAULT_DELIVERY_FEE;
}

/**
 * Calcule le montant de la commission PSR
 */
export function getCommission(productTotal: number): number {
  return Math.round(productTotal * COMMISSION_PERCENT / 100) + COMMISSION_FLAT;
}

export const ITEMS_PER_PAGE = 10;
export const REQUEST_EXPIRY_MINUTES = 30;
export const CURRENCY = 'FCFA';
