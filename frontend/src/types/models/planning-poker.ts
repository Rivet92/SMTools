import type { components } from '../generated/api';

export type PlanningPokerCard = components['schemas']['PlanningPokerCardDto'];

export type PlanningPokerDeck = components['schemas']['PlanningPokerDeckDto'];

export type PlanningPokerRoom = components['schemas']['PlanningPokerRoomResponse'];

export type MyPlanningPokerRoom = components['schemas']['MyPlanningPokerRoomResponse'];

export type RoomState = components['schemas']['RoomStateDto'] & { version: number };

export function getDeckNameKey(deckKey: string): string {
  return `deck:${deckKey}:name`;
}

export function getDeckDescriptionKey(deckKey: string): string {
  return `deck:${deckKey}:description`;
}
