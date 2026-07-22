import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlanningPokerRoomData } from '../usePlanningPokerRoomData';
import { usePlanningPokerStore } from '../../store/planningPokerStore';
import type { RoomState } from '../../store/planningPokerStore';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockRoom: RoomState = {
  id: 'room-1',
  title: 'Sprint Planning',
  createdAt: new Date().toISOString(),
  ownParticipantId: 'p1',
  hasPassword: false,
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: true, isConnected: true },
    { id: 'p2', displayName: 'Bob', isOwner: false, isAdmin: false, isConnected: false },
  ],
  voteItems: [
    { id: 'vi-1', title: 'Story 1', isRevealed: false, votes: [] },
    { id: 'vi-2', title: 'Story 2', isRevealed: false, votes: [] },
  ],
  deckId: '00000000-0000-0000-0000-000000000001',
  version: 1,
};

describe('usePlanningPokerRoomData', () => {
  beforeEach(() => {
    usePlanningPokerStore.setState({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
      selectedVoteItemId: null,
      lastVersion: 0,
    });
  });

  it('returns connection state from store when no room', () => {
    usePlanningPokerStore.setState({ connectionState: 'connected' });
    const { result } = renderHook(() => usePlanningPokerRoomData(), { wrapper: createWrapper() });
    expect(result.current.connectionState).toBe('connected');
    expect(result.current.room).toBeNull();
  });

  it('returns room from store', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    const { result } = renderHook(() => usePlanningPokerRoomData(), { wrapper: createWrapper() });
    expect(result.current.room?.title).toBe('Sprint Planning');
  });

  it('returns isOwner and isAdmin selectors', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    const { result } = renderHook(() => usePlanningPokerRoomData(), { wrapper: createWrapper() });
    expect(result.current.isOwner).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns connected count', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    const { result } = renderHook(() => usePlanningPokerRoomData(), { wrapper: createWrapper() });
    expect(result.current.connectedCount).toBe(1);
  });

  it('returns hasPassword from room', () => {
    usePlanningPokerStore.setState({ room: { ...mockRoom, hasPassword: true } });
    const { result } = renderHook(() => usePlanningPokerRoomData(), { wrapper: createWrapper() });
    expect(result.current.hasPassword).toBe(true);
  });

  it('selects last vote item when none selected', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    const { result } = renderHook(() => usePlanningPokerRoomData(), { wrapper: createWrapper() });
    expect(result.current.selectedVoteItem?.id).toBe('vi-2');
  });

  it('returns empty cards when no decks loaded', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    const { result } = renderHook(() => usePlanningPokerRoomData(), { wrapper: createWrapper() });
    expect(result.current.cards).toEqual([]);
  });
});
