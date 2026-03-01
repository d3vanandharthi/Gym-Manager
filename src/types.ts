export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinDate: string;
  expiryDate: string;
  status: 'active' | 'expired';
  createdAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
}
