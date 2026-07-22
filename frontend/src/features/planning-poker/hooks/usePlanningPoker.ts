import { useQuery } from '@tanstack/react-query';
import { fetchPlanningPokerDecks } from '../../../api/planning-poker';
import type { PlanningPokerDeck } from '../../../types/models/planning-poker';
import { planningPoker } from '../../../api/queryKeys';

export function usePlanningPokerDecks() {
  return useQuery<PlanningPokerDeck[], Error>({
    queryKey: planningPoker.decks,
    queryFn: fetchPlanningPokerDecks,
  });
}
