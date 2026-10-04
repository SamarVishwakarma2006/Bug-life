import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api, ApiError } from '@/services/api';
export function useApi() {
  const { token, logout } = useAuth();
  return async <T>(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<T> => {
    try {
      return await api<T>(
        path,
        {
          method,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        },
        token,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout();
      throw error;
    }
  };
}
export function useWorkspaceMutation<T>(
  action: (values: T) => Promise<unknown>,
  onSuccess?: () => void,
) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['workspace'] });
      onSuccess?.();
    },
  });
}
