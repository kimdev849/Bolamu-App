export interface Order {
  id: string;
  requestId: string;
  pharmacyId: string;
  pharmacyName: string;
  wholesalerId: string;
  wholesalerName: string;
  deliveryCompanyId?: string;
  deliveryCompanyName?: string;
  productName: string;
  productCode: string;
  dosage?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  deliveryPrice: number;
  totalPrice: number;
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'created' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_paid';

export interface Commission {
  id: string;
  orderId: string;
  pharmacyId: string;
  wholesalerId: string;
  amount: number;
  percentage: number;
  status: CommissionStatus;
  createdAt: string;
  paidAt?: string;
}

export type CommissionStatus = 'pending' | 'paid' | 'cancelled';

export interface Subscription {
  id: string;
  pharmacyId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amount: number;
  createdAt: string;
}

export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'cancelled';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export type NotificationType = 'request' | 'order' | 'delivery' | 'payment' | 'system' | 'subscription';
