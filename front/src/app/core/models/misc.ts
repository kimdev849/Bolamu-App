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
  readAt?: string;
  payload?: Record<string, any>;
  createdAt: string;
}

export type NotificationType =
  | 'NEW_REQUEST'
  | 'REQUEST_FOUND'
  | 'REQUEST_EXPIRED'
  | 'NEW_ORDER'
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERY_STATUS_UPDATE'
  | 'NEW_MISSION'
  | 'MISSION_CANCELLED';
