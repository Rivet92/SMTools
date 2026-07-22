import { useQuery } from '@tanstack/react-query';
import { fetchLanguages } from '../../../api/i18n';

export const languagesQueryKey = ['languages'] as const;

export function useLanguages() {
  return useQuery({
    queryKey: languagesQueryKey,
    queryFn: fetchLanguages,
    staleTime: Infinity,
  });
}
