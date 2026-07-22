import { useTranslation } from 'react-i18next';
import { IconCards } from '@tabler/icons-react';
import { LobbyPage, CreateRoomModal } from '../../../components/room-lobby';
import { usePlanningPokerLobby } from '../hooks/usePlanningPokerLobby';
import { useMyRooms } from '../hooks/useMyRooms';
import { useDeleteRoomMutations } from '../hooks/useDeleteRoomMutations';
import { getDeckNameKey } from '../../../types/models/planning-poker';

export function PlanningPokerLobbyPage() {
  const { t } = useTranslation();
  const {
    createModalOpen,
    handleOpenCreateModal,
    handleCloseCreateModal,
    decks,
    createTitle,
    setCreateTitle,
    createPassword,
    setCreatePassword,
    createDeckId,
    setCreateDeckId,
    creating,
    actionError,
    setActionError,
    handleCreateRoom,
  } = usePlanningPokerLobby();

  const { data, isLoading, error } = useMyRooms();
  const rooms = data?.items;
  const { deleteForMe, deleteForEveryone } = useDeleteRoomMutations();

  return (
    <LobbyPage
      feature="planningPoker"
      seoTitleKey="seo.planningPoker.title"
      seoDescriptionKey="seo.planningPoker.description"
      EmptyIcon={IconCards}
      roomRoute={(id) => `/tools/planning-poker/${id}`}
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
          i18nPrefix="planningPoker"
          items={decks}
          selectedItemId={createDeckId}
          onItemChange={setCreateDeckId}
          getItemLabel={(deck) => t(getDeckNameKey(deck.key))}
          itemSelectLabelKey="planningPoker.deckLabel"
        />
      }
    />
  );
}
