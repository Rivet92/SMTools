import { useQuery } from '@tanstack/react-query';
import { fetchRetroTemplates } from '../../../api/retro';
import type { RetroTemplate } from '../../../types/models/retro';
import { retro } from '../../../api/queryKeys';

export function useRetroTemplates() {
  return useQuery<RetroTemplate[], Error>({
    queryKey: retro.templates,
    queryFn: fetchRetroTemplates,
  });
}
