import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api';

export function useCurrentUser() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isError,
    error,
  };
}
