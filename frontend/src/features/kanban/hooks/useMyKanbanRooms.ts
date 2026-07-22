import { kanbanApi } from '../../../api/kanban';
import { useMyRooms } from '../../../hooks/useMyRooms';
import type { MyKanbanRoom } from '../../../types/models/kanban';
import { kanban } from '../../../api/queryKeys';

export function useMyKanbanRooms(page?: number, pageSize?: number) {
  return useMyRooms<MyKanbanRoom>(kanban.myRooms, kanbanApi.fetchMyRooms, page, pageSize);
}
