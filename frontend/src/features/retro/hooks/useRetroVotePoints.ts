import { useMemo } from 'react';

export const MAX_VOTE_POINTS = 5;

export function useRetroVotePoints(cards: Array<{ ownVotePoints: number }> | undefined) {
  const usedVotePoints = useMemo(
    () => cards?.reduce((sum, card) => sum + card.ownVotePoints, 0) ?? 0,
    [cards],
  );
  const remainingVotePoints = MAX_VOTE_POINTS - usedVotePoints;

  return { usedVotePoints, remainingVotePoints, MAX_VOTE_POINTS };
}
