import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRetroRoomActions } from '../useRetroRoomActions';
import { useRetroStore } from '../../store/retroStore';
import type { RoomState } from '../../store/retroStore';

const mockHub = vi.hoisted(() => ({
  addCard: vi.fn<() => Promise<RoomState>>(),
  deleteCard: vi.fn<() => Promise<RoomState>>(),
  addVotePoint: vi.fn<() => Promise<RoomState>>(),
  removeVotePoint: vi.fn<() => Promise<RoomState>>(),
  setPhase: vi.fn<() => Promise<RoomState>>(),
  addActionItem: vi.fn<() => Promise<RoomState>>(),
  deleteActionItem: vi.fn<() => Promise<RoomState>>(),
  assignActionItem: vi.fn<() => Promise<RoomState>>(),
  makeAdmin: vi.fn<() => Promise<RoomState>>(),
  removeAdmin: vi.fn<() => Promise<RoomState>>(),
  removeParticipant: vi.fn<() => Promise<RoomState>>(),
  updateRoomPassword: vi.fn<() => Promise<RoomState>>(),
}));

vi.mock('../../retroHub', () => mockHub);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('../../../../hooks/useCopyRoomLink', () => ({
  useCopyRoomLink: () => ({ copyLink: vi.fn() }),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockRoom: RoomState = {
  id: 'retro-1',
  title: 'Test Retro',
  createdAt: new Date().toISOString(),
  phase: 'Gathering' as const,
  templateId: 'tpl-1',
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: true, isConnected: true },
    { id: 'p2', displayName: 'Bob', isOwner: false, isAdmin: false, isConnected: true },
  ],
  columns: [{ id: 'col-1', key: 'good', displayOrder: 1, color: '#4caf50', icon: 'thumb_up' }],
  cards: [],
  groups: [],
  actionItems: [],
  ownParticipantId: 'p1',
  hasPassword: false,
  version: 1,
};

describe('useRetroRoomActions', () => {
  beforeEach(() => {
    useRetroStore.setState({
      connectionState: 'connected',
      error: null,
      roomClosedMessage: null,
      room: mockRoom,
      lastPassword: null,
      lastVersion: 0,
    });
    vi.clearAllMocks();
  });

  it('returns actionError state', () => {
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });
    expect(result.current.actionError).toBeNull();
  });

  it('handleSubmitCard calls hub.addCard', async () => {
    mockHub.addCard.mockResolvedValue(mockRoom);
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleAddCard('col-1');
    });

    act(() => {
      result.current.setNewCardContent('New card content');
    });

    await act(async () => {
      await result.current.handleSubmitCard();
    });

    expect(mockHub.addCard).toHaveBeenCalledWith('col-1', 'New card content');
  });

  it('handleSubmitCard does not submit empty content', async () => {
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleAddCard('col-1');
    });

    await act(async () => {
      await result.current.handleSubmitCard();
    });

    expect(mockHub.addCard).not.toHaveBeenCalled();
  });

  it('handleDeleteCard calls hub.deleteCard', async () => {
    mockHub.deleteCard.mockResolvedValue(mockRoom);
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleDeleteCard('card-1');
    });

    expect(mockHub.deleteCard).toHaveBeenCalledWith('card-1');
  });

  it('handleAddVotePoint calls hub.addVotePoint', async () => {
    mockHub.addVotePoint.mockResolvedValue(mockRoom);
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleAddVotePoint('card-1');
    });

    expect(mockHub.addVotePoint).toHaveBeenCalledWith('card-1');
  });

  it('handleRemoveVotePoint calls hub.removeVotePoint', async () => {
    mockHub.removeVotePoint.mockResolvedValue(mockRoom);
    useRetroStore.setState({
      room: {
        ...mockRoom,
        cards: [
          {
            id: 'card-1',
            columnId: 'col-1',
            groupId: null,
            content: 'test',
            authorParticipantId: 'p1',
            createdAt: new Date().toISOString(),
            voteCount: 1,
            ownVotePoints: 1,
          },
        ],
      },
    });
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleRemoveVotePoint('card-1');
    });

    expect(mockHub.removeVotePoint).toHaveBeenCalledWith('card-1');
  });

  it('sets error when addVotePoint fails', async () => {
    mockHub.addVotePoint.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleAddVotePoint('card-1');
    });

    expect(result.current.actionError).toBe('retro.errors.addVote');
  });

  it('handleNextPhase calls hub.setPhase', async () => {
    mockHub.setPhase.mockResolvedValue(mockRoom);
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleNextPhase();
    });

    expect(mockHub.setPhase).toHaveBeenCalledWith(1);
  });

  it('handlePreviousPhase calls hub.setPhase', async () => {
    mockHub.setPhase.mockResolvedValue(mockRoom);
    useRetroStore.setState({
      room: { ...mockRoom, phase: 'Grouping' as const },
    });
    const { result } = renderHook(() => useRetroRoomActions(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handlePreviousPhase();
    });

    expect(mockHub.setPhase).toHaveBeenCalledWith(0);
  });
});
