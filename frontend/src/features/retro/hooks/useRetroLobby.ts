import { useRetroStore } from '../store/retroStore';
import { useRetroTemplates } from './useRetroTemplates';
import { retroApi } from '../../../api/retro';
import { retro } from '../../../api/queryKeys';
import { useRoomCreateLobby } from '../../../hooks/useRoomCreateLobby';
import type { RetroTemplate } from '../../../types/models/retro';

export function useRetroLobby() {
  const clearRoom = useRetroStore((s) => s.clearRoom);

  const result = useRoomCreateLobby<RetroTemplate, string>({
    useItems: useRetroTemplates,
    getDefaultItemId: (templates) => templates?.find((t) => t.isDefault)?.id,
    createRoom: (request) =>
      retroApi.create({
        title: request.title,
        password: request.password,
        templateId: request.itemId,
      }),
    queryKey: retro.myRooms,
    clearRoom,
    navigatePath: (id) => `/tools/retro/${id}`,
  });

  return {
    createModalOpen: result.createModalOpen,
    handleOpenCreateModal: result.handleOpenCreateModal,
    handleCloseCreateModal: result.handleCloseCreateModal,
    templates: result.items,
    createTitle: result.createTitle,
    setCreateTitle: result.setCreateTitle,
    createPassword: result.createPassword,
    setCreatePassword: result.setCreatePassword,
    createTemplateId: result.selectedItemId as string | '',
    setCreateTemplateId: result.setSelectedItemId as (value: string | '') => void,
    creating: result.creating,
    actionError: result.actionError,
    setActionError: result.setActionError,
    handleCreateRoom: result.handleCreateRoom,
  };
}
