import { useState, useCallback, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/services/api';
import type { AuthResponse, User } from '@/types/auth';
import { AuthContext } from './auth';

const storageKey = 'buglife-token';
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => sessionStorage.getItem(storageKey));
  const query = useQuery({
    queryKey: ['auth', token],
    queryFn: () => api<{ user: User }>('/auth/me', {}, token),
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });
  const expired = query.error instanceof ApiError && query.error.status === 401;
  function authenticate(response: AuthResponse) {
    queryClient.clear();
    sessionStorage.setItem(storageKey, response.token);
    queryClient.setQueryData(['auth', response.token], { user: response.user });
    setToken(response.token);
  }
  const logout = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);
  return (
    <AuthContext.Provider
      value={{
        token,
        user: expired ? undefined : query.data?.user,
        loading: !!token && query.isPending,
        error: expired ? null : query.error,
        authenticate,
        logout,
        retry: () => {
          void query.refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
