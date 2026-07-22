import { IconLayoutBoardSplitFilled } from '@tabler/icons-react';
import { LobbyPage, CreateRoomModal } from '../../../components/room-lobby';
import { useKanbanLobby } from '../hooks/useKanbanLobby';
import { useMyKanbanRooms } from '../hooks/useMyKanbanRooms';
import { useDeleteKanbanRoomMutations } from '../hooks/useDeleteKanbanRoomMutations';

export function KanbanLobbyPage() {
  const {
    createModalOpen,
    handleOpenCreateModal,
    handleCloseCreateModal,
    createTitle,
    setCreateTitle,
    createPassword,
    setCreatePassword,
    creating,
    actionError,
    setActionError,
    handleCreateRoom,
  } = useKanbanLobby();

  const { data, isLoading, error } = useMyKanbanRooms();
  const rooms = data?.items;
  const { deleteForMe, deleteForEveryone } = useDeleteKanbanRoomMutations();

  return (
    <LobbyPage
      feature="kanban"
      seoTitleKey="seo.kanban.title"
      seoDescriptionKey="seo.kanban.description"
      EmptyIcon={IconLayoutBoardSplitFilled}
      roomRoute={(id) => `/tools/kanban/${id}`}
      rooms={rooms}
      isLoading={isLoading}
      error={error}
      deleteForMe={deleteForMe}
      deleteForEveryone={deleteForEveryone}
      handleOpenCreateModal={handleOpenCreateModal}
      createRoomModal={
        <CreateRoomModal
          open={createModalOpen}
          onClose={handleCloseCreateModal}
          creating={creating}
          createTitle={createTitle}
          onTitleChange={setCreateTitle}
          createPassword={createPassword}
          onPasswordChange={setCreatePassword}
          onCreate={handleCreateRoom}
          actionError={actionError}
          onClearError={() => setActionError(null)}
          i18nPrefix="kanban"
        />
      }
    />
  );
}
