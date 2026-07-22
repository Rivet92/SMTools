import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlanningPokerRoomActions } from '../usePlanningPokerRoomActions';
import { usePlanningPokerStore } from '../../store/planningPokerStore';
import type { VoteItemState, RoomState } from '../../store/planningPokerStore';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useNavigate: () => vi.fn(),
  };
});

const mockHub = vi.hoisted(() => ({
  vote: vi.fn(),
  revealVotes: vi.fn(),
  resetVotes: vi.fn(),
  addVoteItem: vi.fn(),
  focusVoteItem: vi.fn(),
  deleteVoteItem: vi.fn(),
  makeAdmin: vi.fn(),
  removeAdmin: vi.fn(),
  removeParticipant: vi.fn(),
  updateRoomPassword: vi.fn(),
}));

vi.mock('../../planningPokerHub', () => mockHub);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockRoom: RoomState = {
  id: 'room-1',
  title: 'Test Room',
  createdAt: new Date().toISOString(),
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
  ],
  voteItems: [{ id: 'vi-1', title: 'Item 1', isRevealed: false, votes: [] }],
  ownParticipantId: 'p1',
  deckId: '00000000-0000-0000-0000-000000000001',
  hasPassword: false,
  version: 1,
};

const selectedVoteItem: VoteItemState = {
  id: 'vi-1',
  title: 'Item 1',
  isRevealed: false,
  votes: [],
};

describe('usePlanningPokerRoomActions', () => {
  beforeEach(() => {
    usePlanningPokerStore.setState({
      connectionState: 'connected',
      error: null,
      roomClosedMessage: null,
      room: mockRoom,
      selectedVoteItemId: null,
      lastVersion: 0,
      lastPassword: null,
    });
    vi.clearAllMocks();
  });

  it('calls hub.vote when handleVote is invoked', async () => {
    const voteResult = { state: mockRoom, version: 1 };
    mockHub.vote.mockResolvedValue(voteResult);

    const { result } = renderHook(() => usePlanningPokerRoomActions(selectedVoteItem), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleVote('5');
    });

    expect(mockHub.vote).toHaveBeenCalledWith('vi-1', '5');
  });

  it('does not vote when no selectedVoteItem', async () => {
    const { result } = renderHook(() => usePlanningPokerRoomActions(null), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleVote('5');
    });

    expect(mockHub.vote).not.toHaveBeenCalled();
  });

  it('calls hub.revealVotes when handleReveal is invoked', async () => {
    mockHub.revealVotes.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePlanningPokerRoomActions(selectedVoteItem), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleReveal();
    });

    expect(mockHub.revealVotes).toHaveBeenCalledWith('vi-1');
  });

  it('calls hub.resetVotes when handleReset is invoked', async () => {
    mockHub.resetVotes.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePlanningPokerRoomActions(selectedVoteItem), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleReset();
    });

    expect(mockHub.resetVotes).toHaveBeenCalledWith('vi-1');
  });

  it('calls hub.addVoteItem when handleAddVoteItemSubmit is invoked', async () => {
    const newRoom = {
      ...mockRoom,
      voteItems: [
        ...mockRoom.voteItems,
        { id: 'vi-2', title: 'New Item', isRevealed: false, votes: [] },
      ],
    };
    mockHub.addVoteItem.mockResolvedValue(newRoom);

    const { result } = renderHook(() => usePlanningPokerRoomActions(selectedVoteItem), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleAddVoteItemSubmit('New Item');
    });

    expect(mockHub.addVoteItem).toHaveBeenCalledWith('New Item');
  });

  it('does not add empty vote item', async () => {
    const { result } = renderHook(() => usePlanningPokerRoomActions(selectedVoteItem), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleAddVoteItemSubmit('   ');
    });

    expect(mockHub.addVoteItem).not.toHaveBeenCalled();
  });

  it('sets snackbarError when vote fails', async () => {
    mockHub.vote.mockRejectedValue(new Error('Vote failed'));

    const { result } = renderHook(() => usePlanningPokerRoomActions(selectedVoteItem), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleVote('5');
    });

    expect(result.current.snackbarError).toBeTruthy();
  });
});
