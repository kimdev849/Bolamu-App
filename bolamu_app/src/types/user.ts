export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  createdAt?: string;
  profile?: { id: string; firstName?: string; lastName?: string; name?: string } | null;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    avatarUrl?: string;
    status: string;
    profile: { id: string; name: string } | null;
  };
  tokens: { accessToken: string; refreshToken: string };
}
