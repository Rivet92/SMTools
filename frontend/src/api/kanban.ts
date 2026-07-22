import { createRoomApi } from './createRoomApi';
import type { KanbanRoom, MyKanbanRoom } from '../types/models/kanban';
import type { RoomState } from '../types/models/kanban';

export const kanbanApi = createRoomApi<KanbanRoom, MyKanbanRoom, RoomState>('/kanban');
