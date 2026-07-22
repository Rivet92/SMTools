import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as hub from '../retroHub';
import { useRetroStore } from '../store/retroStore';
import { makeRoomAction } from '../../../hooks/makeRoomAction';
import { getErrorMessage } from '../../../hooks/getErrorMessage';

export function useRetroActionItems(setActionError: (error: string | null) => void) {
  const { t } = useTranslation();
  const setRoom = useRetroStore((s) => s.setRoom);

  const handleSubmitActionItem = useCallback(
    async (content: string, assigneeParticipantId?: string) => {
      setActionError(null);
      try {
        const result = await hub.addActionItem(content, assigneeParticipantId);
        setRoom(result);
      } catch (err) {
        setActionError(t('retro.errors.addActionItem', { message: getErrorMessage(err, t) }));
      }
    },
    [setRoom, t, setActionError],
  );

  const handleDeleteActionItem = useMemo(
    () =>
      makeRoomAction((actionItemId: string) => hub.deleteActionItem(actionItemId), {
        t,
        errorKey: 'retro.errors.deleteActionItem',
        setRoom,
        setError: setActionError,
      }),
    [setRoom, t, setActionError],
  );

  const handleAssignActionItem = useMemo(
    () =>
      makeRoomAction(
        (actionItemId: string, assigneeParticipantId: string | null) =>
          hub.assignActionItem(actionItemId, assigneeParticipantId),
        {
          t,
          errorKey: 'retro.errors.assignActionItem',
          setRoom,
          setError: setActionError,
        },
      ),
    [setRoom, t, setActionError],
  );

  return { handleSubmitActionItem, handleDeleteActionItem, handleAssignActionItem };
}
