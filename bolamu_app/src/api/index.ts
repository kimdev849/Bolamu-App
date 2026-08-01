import apiClient from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';
import type { Order } from '../types/order';

/** API du livreur — branche sur les endpoints existants du backend. */
export const driverApi = {
  /** Missions de l'entreprise de livraison (commandes assignées). */
  getMissions: () => apiClient.get<PaginatedResponse<Order>>('/orders', { params: { limit: 50 } }),
  /** Détail d'une mission. */
  getMission: (id: string) => apiClient.get<ApiResponse<Order>>(`/orders/${id}`),
  /** Mise à jour du statut de livraison. */
  updateMissionStatus: (id: string, deliveryStatus: string) =>
    apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, { deliveryStatus }),
  /** Vérification du code OTP remis par la pharmacie (confirme la livraison). */
  verifyMissionOtp: (id: string, otpCode: string) =>
    apiClient.post<ApiResponse<Order>>(`/orders/${id}/verify-otp`, { otpCode }),
};
