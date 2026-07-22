import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as hub from '../retroHub';
import { useRetroStore } from '../store/retroStore';
import { useRetroVotePoints } from './useRetroVotePoints';
import { getErrorMessage } from '../../../hooks/getErrorMessage';

export function useRetroVoteActions(setActionError: (error: string | null) => void) {
  const { t } = useTranslation();
  const room = useRetroStore((s) => s.room);
  const optimisticVote = useRetroStore((s) => s.optimisticVote);
  const optimisticRemoveVote = useRetroStore((s) => s.optimisticRemoveVote);

  const { remainingVotePoints, MAX_VOTE_POINTS } = useRetroVotePoints(room?.cards);

  const handleAddVotePoint = useCallback(
    async (cardId: string) => {
      setActionError(null);
      if (remainingVotePoints <= 0) return;
      optimisticVote(cardId);
      try {
        await hub.addVotePoint(cardId);
      } catch (err) {
        setActionError(t('retro.errors.addVote', { message: getErrorMessage(err, t) }));
      }
    },
    [remainingVotePoints, optimisticVote, t, setActionError],
  );

  const handleRemoveVotePoint = useCallback(
    async (cardId: string) => {
      setActionError(null);
      const card = room?.cards.find((c) => c.id === cardId);
      if (!card || card.ownVotePoints <= 0) return;
      optimisticRemoveVote(cardId);
      try {
        await hub.removeVotePoint(cardId);
      } catch (err) {
        setActionError(t('retro.errors.removeVote', { message: getErrorMessage(err, t) }));
      }
    },
    [room?.cards, optimisticRemoveVote, t, setActionError],
  );

  return {
    handleAddVotePoint,
    handleRemoveVotePoint,
    remainingVotePoints,
    totalVotePoints: MAX_VOTE_POINTS,
  };
}
