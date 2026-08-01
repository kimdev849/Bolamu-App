export interface Order {
  id: string;
  reference: string;
  requestId: string;
  pharmacyId: string;
  wholesalerId: string;
  productAmount: number;
  deliveryAmount: number;
  commissionAmount: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  deliveryStatus?: string;
  paymentStatus: string;
  createdAt: string;
  pharmacy?: { id: string; name: string; phone: string };
  wholesaler?: { id: string; name: string; phone: string };
  request?: { id: string; reference: string; productName: string; quantity: number; isUrgent: boolean };
  delivery?: { id: string; deliveryCompany: { id: string; name: string }; status: string };
  payment?: any;
}

export type OrderStatus = 'CREATED' | 'CONFIRMED' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
