import { useDeleteRoomMutations as useDeleteRoomMutationsShared } from '../../../hooks/useDeleteRoomMutations';
import { planningPokerApi } from '../../../api/planning-poker';
import { planningPoker } from '../../../api/queryKeys';

export function useDeleteRoomMutations() {
  return useDeleteRoomMutationsShared(
    planningPoker.myRooms,
    planningPokerApi.removeSelf,
    planningPokerApi.delete,
  );
}
