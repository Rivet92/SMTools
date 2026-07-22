import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRetroStore } from '../store/retroStore';
import { useRetroTemplates } from './useRetroTemplates';
import { useRetroVotePoints } from './useRetroVotePoints';
import { selectIsOwner, selectIsAdmin, selectConnectedCount } from '../../../stores/roomSelectors';
import { RetroPhase } from '../../../types/models/retro';

export function useRetroRoomData() {
  const { t } = useTranslation();

  const room = useRetroStore((s) => s.room);
  const storeError = useRetroStore((s) => s.error);
  const setError = useRetroStore((s) => s.setError);
  const isOwner = useRetroStore((s) => selectIsOwner(s.room));
  const isAdmin = useRetroStore((s) => selectIsAdmin(s.room));
  const connectedCount = useRetroStore((s) => selectConnectedCount(s.room));

  const { data: templates } = useRetroTemplates();
  const template = useMemo(
    () => templates?.find((t) => t.id === room?.templateId),
    [templates, room?.templateId],
  );

  const canManage = isAdmin;

  const { remainingVotePoints, MAX_VOTE_POINTS } = useRetroVotePoints(room?.cards);

  const phaseName = useMemo(() => {
    switch (room?.phase) {
      case RetroPhase.Gathering:
        return t('retro.phase:gathering');
      case RetroPhase.Grouping:
        return t('retro.phase:grouping');
      case RetroPhase.Voting:
        return t('retro.phase:voting');
      case RetroPhase.Actions:
        return t('retro.phase:actions');
      default:
        return '';
    }
  }, [room?.phase, t]);

  return {
    room,
    storeError,
    setError,
    isOwner,
    isAdmin,
    canManage,
    connectedCount,
    template,
    hasPassword: room?.hasPassword ?? false,
    remainingVotePoints,
    totalVotePoints: MAX_VOTE_POINTS,
    phaseName,
  };
}
