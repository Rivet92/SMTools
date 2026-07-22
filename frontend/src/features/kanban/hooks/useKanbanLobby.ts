import { useKanbanStore } from '../store/kanbanStore';
import { kanbanApi } from '../../../api/kanban';
import { kanban } from '../../../api/queryKeys';
import { useRoomCreateLobby } from '../../../hooks/useRoomCreateLobby';

function useNoItems(): { data: never[] } {
  return { data: [] };
}

export function useKanbanLobby() {
  const clearRoom = useKanbanStore((s) => s.clearRoom);

  const result = useRoomCreateLobby<never, string>({
    useItems: useNoItems,
    getDefaultItemId: () => undefined,
    createRoom: (request) =>
      kanbanApi.create({
        title: request.title,
        password: request.password,
      }),
    queryKey: kanban.myRooms,
    clearRoom,
    navigatePath: (id) => `/tools/kanban/${id}`,
  });

  return {
    createModalOpen: result.createModalOpen,
    handleOpenCreateModal: result.handleOpenCreateModal,
    handleCloseCreateModal: result.handleCloseCreateModal,
    createTitle: result.createTitle,
    setCreateTitle: result.setCreateTitle,
    createPassword: result.createPassword,
    setCreatePassword: result.setCreatePassword,
    creating: result.creating,
    actionError: result.actionError,
    setActionError: result.setActionError,
    handleCreateRoom: result.handleCreateRoom,
  };
}
