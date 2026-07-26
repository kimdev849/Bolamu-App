export interface Wholesaler {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  licenseNumber: string;
  isVerified: boolean;
  isActive: boolean;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WholesalerStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}
