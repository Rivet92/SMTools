import { useTranslation } from 'react-i18next';
import { IconClipboardText } from '@tabler/icons-react';
import { LobbyPage, CreateRoomModal } from '../../../components/room-lobby';
import { useRetroLobby } from '../hooks/useRetroLobby';
import { useMyRetroRooms } from '../hooks/useMyRetroRooms';
import { useDeleteRetroRoomMutations } from '../hooks/useDeleteRetroRoomMutations';
import { getRetroTemplateNameKey } from '../../../types/models/retro';

export function RetroPage() {
  const { t } = useTranslation();
  const {
    createModalOpen,
    handleOpenCreateModal,
    handleCloseCreateModal,
    templates,
    createTitle,
    setCreateTitle,
    createPassword,
    setCreatePassword,
    createTemplateId,
    setCreateTemplateId,
    creating,
    actionError,
    setActionError,
    handleCreateRoom,
  } = useRetroLobby();

  const { data, isLoading, error } = useMyRetroRooms();
  const rooms = data?.items;
  const { deleteForMe, deleteForEveryone } = useDeleteRetroRoomMutations();

  return (
    <LobbyPage
      feature="retro"
      seoTitleKey="seo.retro.title"
      seoDescriptionKey="seo.retro.description"
      EmptyIcon={IconClipboardText}
      roomRoute={(id) => `/tools/retro/${id}`}
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
          i18nPrefix="retro"
          items={templates}
          selectedItemId={createTemplateId}
          onItemChange={setCreateTemplateId}
          getItemLabel={(template) => t(getRetroTemplateNameKey(template.key))}
          itemSelectLabelKey="retro.templateLabel"
        />
      }
    />
  );
}
