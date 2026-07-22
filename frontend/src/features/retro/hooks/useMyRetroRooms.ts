import { retroApi } from '../../../api/retro';
import { useMyRooms } from '../../../hooks/useMyRooms';
import type { MyRetroRoom } from '../../../types/models/retro';
import { retro } from '../../../api/queryKeys';

export function useMyRetroRooms(page?: number, pageSize?: number) {
  return useMyRooms<MyRetroRoom>(retro.myRooms, retroApi.fetchMyRooms, page, pageSize);
}
