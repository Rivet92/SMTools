import { planningPokerApi } from '../../../api/planning-poker';
import { useMyRooms as useMyRoomsShared } from '../../../hooks/useMyRooms';
import type { MyPlanningPokerRoom } from '../../../types/models/planning-poker';
import { planningPoker } from '../../../api/queryKeys';

export function useMyRooms(page?: number, pageSize?: number) {
  return useMyRoomsShared<MyPlanningPokerRoom>(
    planningPoker.myRooms,
    planningPokerApi.fetchMyRooms,
    page,
    pageSize,
  );
}
