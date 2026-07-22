import { apiGet } from './client';
import { createRoomApi } from './createRoomApi';
import type {
  PlanningPokerDeck,
  PlanningPokerRoom,
  MyPlanningPokerRoom,
} from '../types/models/planning-poker';
import type { RoomState } from '../types/models/planning-poker';

export const planningPokerApi = createRoomApi<PlanningPokerRoom, MyPlanningPokerRoom, RoomState>(
  '/planningpoker',
);

export async function fetchPlanningPokerDecks(): Promise<PlanningPokerDeck[]> {
  return apiGet('/planningpoker/decks');
}
