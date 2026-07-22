import { useQuery } from '@tanstack/react-query';
import type { PagedResponse } from '../types/models/common';

export function useMyRooms<T>(queryKey: readonly string[], fetchFn: (page?: number, pageSize?: number) => Promise<PagedResponse<T>>, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: () => fetchFn(page, pageSize),
  });
}
