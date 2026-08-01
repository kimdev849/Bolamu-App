import apiClient from './client';
import type { ApiResponse } from '../types/common';
import type { LoginResponse, User } from '../types/user';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),
  getMe: () => apiClient.get<ApiResponse<User>>('/auth/me'),
  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', { email, token, newPassword }),
  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),
};
