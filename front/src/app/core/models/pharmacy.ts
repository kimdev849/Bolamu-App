export interface Pharmacy {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  licenseNumber: string;
  pharmacistInCharge: string;
  isVerified: boolean;
  isActive: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'cancelled';

export interface PharmacyStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRequests: number;
  pendingRequests: number;
  revenue: number;
  monthlyRevenue: number;
}
