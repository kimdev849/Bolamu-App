import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginatedResponse } from '../models/common';
import type { User } from '../models/user';
import type { Pharmacy } from '../models/pharmacy';
import type { Wholesaler } from '../models/wholesaler';
import type { DeliveryCompany, DeliveryAgent } from '../models/delivery-company';
import type { ProductRequest, RequestResponse } from '../models/request';
import type { Order } from '../models/misc';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ───── Auth ─────

  login(email: string, password: string): Observable<ApiResponse<{ user: LoginUser; tokens: { accessToken: string; refreshToken: string } }>> {
    return this.http.post<ApiResponse<{ user: LoginUser; tokens: { accessToken: string; refreshToken: string } }>>(
      `${this.baseUrl}/auth/login`, { email, password }
    );
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/auth/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/auth/change-password`, { currentPassword, newPassword });
  }

  // ───── Admin ─────

  getAdminStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.baseUrl}/admin/stats`);
  }

  getAdminPharmacies(page = 1, limit = 10): Observable<ApiResponse<Pharmacy[]> & { pagination: PaginationInfo }> {
    return this.http.get<ApiResponse<Pharmacy[]> & { pagination: PaginationInfo }>(
      `${this.baseUrl}/admin/pharmacies`, { params: new HttpParams().set('page', page).set('limit', limit) }
    );
  }

  getAdminPharmacyDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/admin/pharmacies/${id}`);
  }

  getAdminWholesalers(page = 1, limit = 10): Observable<ApiResponse<Wholesaler[]> & { pagination: PaginationInfo }> {
    return this.http.get<ApiResponse<Wholesaler[]> & { pagination: PaginationInfo }>(
      `${this.baseUrl}/admin/wholesalers`, { params: new HttpParams().set('page', page).set('limit', limit) }
    );
  }

  getAdminWholesalerDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/admin/wholesalers/${id}`);
  }

  getAdminDeliveryCompanies(page = 1, limit = 10): Observable<ApiResponse<DeliveryCompany[]> & { pagination: PaginationInfo }> {
    return this.http.get<ApiResponse<DeliveryCompany[]> & { pagination: PaginationInfo }>(
      `${this.baseUrl}/admin/delivery-companies`, { params: new HttpParams().set('page', page).set('limit', limit) }
    );
  }

  getAdminDeliveryCompanyDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/admin/delivery-companies/${id}`);
  }

  // ───── Pharmacies (My) ─────

  /** Alias: convenience for pharmacy-profile, pharmacy-dashboard */
  getMyPharmacyProfile(): Observable<ApiResponse<Pharmacy>> {
    return this.http.get<ApiResponse<Pharmacy>>(`${this.baseUrl}/pharmacies/me`);
  }

  getMyPharmacy(): Observable<ApiResponse<Pharmacy>> {
    return this.getMyPharmacyProfile();
  }

  updateMyPharmacy(data: Partial<Pharmacy>): Observable<ApiResponse<Pharmacy>> {
    return this.http.put<ApiResponse<Pharmacy>>(`${this.baseUrl}/pharmacies/me`, data);
  }

  getPharmacyDashboard(): Observable<ApiResponse<PharmacyDashboardData>> {
    return this.http.get<ApiResponse<PharmacyDashboardData>>(`${this.baseUrl}/pharmacies/dashboard`);
  }

  // ───── Wholesalers (My) ─────

  /** Alias: convenience for wholesaler-profile */
  getMyWholesalerProfile(): Observable<ApiResponse<Wholesaler>> {
    return this.http.get<ApiResponse<Wholesaler>>(`${this.baseUrl}/wholesalers/me`);
  }

  getMyWholesaler(): Observable<ApiResponse<Wholesaler>> {
    return this.getMyWholesalerProfile();
  }

  updateMyWholesaler(data: Partial<Wholesaler>): Observable<ApiResponse<Wholesaler>> {
    return this.http.put<ApiResponse<Wholesaler>>(`${this.baseUrl}/wholesalers/me`, data);
  }

  getWholesalerDashboard(): Observable<ApiResponse<WholesalerDashboardData>> {
    return this.http.get<ApiResponse<WholesalerDashboardData>>(`${this.baseUrl}/wholesalers/dashboard`);
  }

  /** Alias: get requests visible to the current wholesaler (for FCFS) */
  getMyWholesalerRequests(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/wholesalers/requests`);
  }

  // ───── Delivery Companies ─────

  getMyDeliveryCompany(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/delivery-companies/me`);
  }

  updateMyDeliveryCompany(data: Partial<DeliveryCompany>): Observable<ApiResponse<DeliveryCompany>> {
    return this.http.put<ApiResponse<DeliveryCompany>>(`${this.baseUrl}/delivery-companies/me`, data);
  }

  getDeliveryDashboard(): Observable<ApiResponse<DeliveryDashboardData>> {
    return this.http.get<ApiResponse<DeliveryDashboardData>>(`${this.baseUrl}/delivery-companies/dashboard`);
  }

  getDeliveryAgents(): Observable<ApiResponse<DeliveryAgent[]>> {
    return this.http.get<ApiResponse<DeliveryAgent[]>>(`${this.baseUrl}/delivery-companies/agents`);
  }

  createDeliveryAgent(agent: Partial<DeliveryAgent>): Observable<ApiResponse<DeliveryAgent>> {
    return this.http.post<ApiResponse<DeliveryAgent>>(`${this.baseUrl}/delivery-companies/agents`, agent);
  }

  toggleDeliveryAgent(id: string): Observable<ApiResponse<DeliveryAgent>> {
    return this.http.patch<ApiResponse<DeliveryAgent>>(`${this.baseUrl}/delivery-companies/agents/${id}/toggle`, {});
  }

  /** Alias: get delivery missions (orders with delivery tracking) */
  getDeliveryMissions(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/delivery-companies/missions`);
  }

  // ───── Requests ─────

  getMyRequests(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/pharmacies/requests`);
  }

  getMyOrders(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/pharmacies/orders`);
  }

  getRequests(params?: { status?: string; urgency?: string; page?: number; limit?: number }): Observable<ApiResponse<ProductRequest[]> & { pagination: PaginationInfo }> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.urgency) httpParams = httpParams.set('urgency', params.urgency);
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<ApiResponse<ProductRequest[]> & { pagination: PaginationInfo }>(`${this.baseUrl}/requests`, { params: httpParams });
  }

  getRequestDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/requests/${id}`);
  }

  createRequest(data: { productName: string; quantity: number; dosage?: string; isUrgent?: boolean; notes?: string }): Observable<ApiResponse<ProductRequest>> {
    return this.http.post<ApiResponse<ProductRequest>>(`${this.baseUrl}/requests`, data);
  }

  acceptRequest(id: string, price: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/requests/${id}/accept`, { price });
  }

  declineRequest(id: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/requests/${id}/decline`, {});
  }

  confirmRequest(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/requests/${id}/confirm`, {});
  }

  cancelRequest(id: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/requests/${id}/cancel`, {});
  }

  markRequestPaid(id: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/requests/${id}/mark-paid`, {});
  }

  // ───── Orders ─────

  getOrders(params?: { status?: string; page?: number; limit?: number }): Observable<ApiResponse<Order[]> & { pagination: PaginationInfo }> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<ApiResponse<Order[]> & { pagination: PaginationInfo }>(`${this.baseUrl}/orders`, { params: httpParams });
  }

  getOrderDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/orders/${id}`);
  }

  assignDelivery(orderId: string, deliveryCompanyId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/orders/${orderId}/assign-delivery`, { deliveryCompanyId });
  }

  updateOrderStatus(id: string, data: { orderStatus?: string; deliveryStatus?: string }): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/orders/${id}/status`, data);
  }

  // ───── Auth extras ─────

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/auth/reset-password`, { email, token, newPassword });
  }

  // ───── Onboarding (public) ─────

  submitOnboardingRequest(data: { entityType: string; entityName: string; email: string; phone: string; city: string; licenseNumber?: string; notes?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/onboarding`, data);
  }

  getOnboardingRequests(status?: string): Observable<ApiResponse<any[]>> {
    const params = status && status !== 'all' ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/onboarding`, { params });
  }

  approveOnboardingRequest(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/onboarding/${id}/approve`, {});
  }

  rejectOnboardingRequest(id: string, reason?: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/onboarding/${id}/reject`, { reason });
  }

  // ───── Admin entity creation ─────

  createAdminPharmacy(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/admin/pharmacies`, data);
  }

  createAdminWholesaler(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/admin/wholesalers`, data);
  }

  createAdminDeliveryCompany(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/admin/delivery-companies`, data);
  }
}

// ───── Types de réponse API ─────

export interface LoginUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
  avatarUrl?: string;
  profile?: { id: string; name: string } | null;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalPharmacies: number;
  activePharmacies: number;
  totalWholesalers: number;
  totalDeliveryCompanies: number;
  totalOrders: number;
  pendingOrders: number;
  totalRequests: number;
  searchingRequests: number;
}

export interface PharmacyDashboardData {
  stats: {
    totalRequests: number;
    searchingRequests: number;
    totalOrders: number;
    activeOrders: number;
    totalSpent: number;
  };
}

export interface WholesalerDashboardData {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  };
}

export interface DeliveryDashboardData {
  stats: {
    totalMissions: number;
    activeMissions: number;
    totalAgents: number;
    activeAgents: number;
  };
}
