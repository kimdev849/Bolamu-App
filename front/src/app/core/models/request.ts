export interface ProductRequest {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  productName: string;
  productCode: string;
  dosage?: string;
  quantity: number;
  unit: string;
  status: RequestStatus;
  urgency: RequestUrgency;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** ID du grossiste qui a trouvé le produit (FCFS) */
  foundById?: string;
  /** Date à laquelle le produit a été trouvé */
  foundAt?: string;
  /** Prix proposé par le grossiste */
  foundPrice?: number;
  /** Frais de livraison estimés */
  deliveryPrice?: number;
  /** Réponses des grossistes (déclinées ou acceptées) */
  responses?: RequestResponse[];
}

export type RequestStatus = 'pending' | 'searching' | 'found' | 'matched' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export type RequestUrgency = 'low' | 'normal' | 'high' | 'emergency';

export type ResponseType = 'accepted' | 'declined';

export interface RequestResponse {
  id: string;
  wholesalerId: string;
  wholesalerName: string;
  type: ResponseType;
  price?: number;
  availableQuantity?: number;
  estimatedDeliveryDays?: number;
  notes?: string;
  createdAt: string;
}

export interface RequestStats {
  total: number;
  pending: number;
  matched: number;
  completed: number;
  cancelled: number;
}
