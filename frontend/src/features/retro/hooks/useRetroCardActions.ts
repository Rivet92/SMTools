import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as hub from '../retroHub';
import { useRetroStore } from '../store/retroStore';
import { makeRoomAction } from '../../../hooks/makeRoomAction';

export function useRetroCardActions(setActionError: (error: string | null) => void) {
  const { t } = useTranslation();
  const setRoom = useRetroStore((s) => s.setRoom);

  const handleDeleteCard = useMemo(
    () =>
      makeRoomAction((cardId: string) => hub.deleteCard(cardId), {
        t,
        errorKey: 'retro.errors.deleteCard',
        setRoom,
        setError: setActionError,
      }),
    [setRoom, t, setActionError],
  );

  const handleCreateGroupFromCards = useMemo(
    () =>
      makeRoomAction(
        (firstCardId: string, secondCardId: string, title: string) =>
          hub.createGroupFromCards(title, firstCardId, secondCardId),
        { t, errorKey: 'retro.errors.createGroup', setRoom, setError: setActionError },
      ),
    [setRoom, t, setActionError],
  );

  const handleMoveCardToGroup = useMemo(
    () =>
      makeRoomAction((cardId: string, groupId?: string) => hub.moveCardToGroup(cardId, groupId), {
        t,
        errorKey: 'retro.errors.moveCard',
        setRoom,
        setError: setActionError,
      }),
    [setRoom, t, setActionError],
  );

  return { handleDeleteCard, handleCreateGroupFromCards, handleMoveCardToGroup };
}
