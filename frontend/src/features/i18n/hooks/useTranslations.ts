import { useQuery } from '@tanstack/react-query';
import { fetchTranslations } from '../../../api/i18n';

export const translationsQueryKey = (languageCode: string) =>
  ['translations', languageCode] as const;

export function useTranslations(languageCode: string) {
  return useQuery({
    queryKey: translationsQueryKey(languageCode),
    queryFn: () => fetchTranslations(languageCode),
    staleTime: Infinity,
    enabled: Boolean(languageCode),
  });
}
