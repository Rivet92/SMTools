import { useMemo } from 'react';
import { usePlanningPokerStore } from '../store/planningPokerStore';
import { usePlanningPokerDecks } from './usePlanningPoker';
import { selectIsOwner, selectIsAdmin, selectConnectedCount } from '../../../stores/roomSelectors';

export function usePlanningPokerRoomData() {
  const room = usePlanningPokerStore((s) => s.room);
  const connectionState = usePlanningPokerStore((s) => s.connectionState);
  const storeError = usePlanningPokerStore((s) => s.error);
  const setError = usePlanningPokerStore((s) => s.setError);
  const selectedVoteItemId = usePlanningPokerStore((s) => s.selectedVoteItemId);
  const setSelectedVoteItemId = usePlanningPokerStore((s) => s.setSelectedVoteItemId);
  const isOwner = usePlanningPokerStore((s) => selectIsOwner(s.room));
  const isAdmin = usePlanningPokerStore((s) => selectIsAdmin(s.room));
  const connectedCount = usePlanningPokerStore((s) => selectConnectedCount(s.room));

  const { data: decks } = usePlanningPokerDecks();

  const defaultDeckId = useMemo(() => decks?.find((d) => d.isDefault)?.id, [decks]);

  const cards = useMemo(() => {
    if (!decks) return [];
    const deckId = room?.deckId ?? defaultDeckId;
    const deck = decks.find((d) => d.id === deckId);
    return deck?.cards ?? [];
  }, [decks, room?.deckId, defaultDeckId]);

  const selectedVoteItem = useMemo(
    () =>
      room?.voteItems.find((vi) => vi.id === selectedVoteItemId) ??
      room?.voteItems[room.voteItems.length - 1] ??
      null,
    [room, selectedVoteItemId],
  );

  return {
    room,
    connectionState,
    storeError,
    setError,
    isOwner,
    isAdmin,
    connectedCount,
    selectedVoteItemId,
    setSelectedVoteItemId,
    selectedVoteItem,
    cards,
    hasPassword: room?.hasPassword ?? false,
  };
}
