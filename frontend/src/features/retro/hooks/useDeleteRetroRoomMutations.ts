import { useDeleteRoomMutations } from '../../../hooks/useDeleteRoomMutations';
import { retroApi } from '../../../api/retro';
import { retro } from '../../../api/queryKeys';

export function useDeleteRetroRoomMutations() {
  return useDeleteRoomMutations(retro.myRooms, retroApi.removeSelf, retroApi.delete);
}
