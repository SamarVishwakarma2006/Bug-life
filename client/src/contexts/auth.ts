import { createContext } from 'react';
import type { AuthResponse, User } from '@/types/auth';
export const AuthContext = createContext<{
  token: string | null;
  user: User | undefined;
  loading: boolean;
  error: Error | null;
  authenticate: (response: AuthResponse) => void;
  logout: () => void;
  retry: () => void;
} | null>(null);
