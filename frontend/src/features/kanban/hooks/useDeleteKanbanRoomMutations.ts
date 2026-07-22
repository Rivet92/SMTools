import { useDeleteRoomMutations } from '../../../hooks/useDeleteRoomMutations';
import { kanbanApi } from '../../../api/kanban';
import { kanban } from '../../../api/queryKeys';

export function useDeleteKanbanRoomMutations() {
  return useDeleteRoomMutations(kanban.myRooms, kanbanApi.removeSelf, kanbanApi.delete);
}
