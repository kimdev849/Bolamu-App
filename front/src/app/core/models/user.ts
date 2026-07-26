export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'pharmacy' | 'wholesaler' | 'delivery_company';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
