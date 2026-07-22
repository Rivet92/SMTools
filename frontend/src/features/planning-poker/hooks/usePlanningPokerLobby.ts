import { usePlanningPokerStore } from '../store/planningPokerStore';
import { usePlanningPokerDecks } from './usePlanningPoker';
import { planningPokerApi } from '../../../api/planning-poker';
import { planningPoker } from '../../../api/queryKeys';
import { useRoomCreateLobby } from '../../../hooks/useRoomCreateLobby';
import type { PlanningPokerDeck } from '../../../types/models/planning-poker';

export function usePlanningPokerLobby() {
  const clearRoom = usePlanningPokerStore((s) => s.clearRoom);

  const result = useRoomCreateLobby<PlanningPokerDeck, string>({
    useItems: usePlanningPokerDecks,
    getDefaultItemId: (decks) => decks?.find((d) => d.isDefault)?.id,
    createRoom: (request) =>
      planningPokerApi.create({
        title: request.title,
        password: request.password,
        deckId: request.itemId,
      }),
    queryKey: planningPoker.myRooms,
    clearRoom,
    navigatePath: (id) => `/tools/planning-poker/${id}`,
  });

  return {
    createModalOpen: result.createModalOpen,
    handleOpenCreateModal: result.handleOpenCreateModal,
    handleCloseCreateModal: result.handleCloseCreateModal,
    decks: result.items,
    createTitle: result.createTitle,
    setCreateTitle: result.setCreateTitle,
    createPassword: result.createPassword,
    setCreatePassword: result.setCreatePassword,
    createDeckId: result.selectedItemId as string | '',
    setCreateDeckId: result.setSelectedItemId as (value: string | '') => void,
    creating: result.creating,
    actionError: result.actionError,
    setActionError: result.setActionError,
    handleCreateRoom: result.handleCreateRoom,
  };
}
