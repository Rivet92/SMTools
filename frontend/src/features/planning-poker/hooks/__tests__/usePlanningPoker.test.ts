import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanningPokerLobby } from '../usePlanningPokerLobby';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

const mockCreateRoom = vi.fn();
vi.mock('../../../../api/planning-poker', () => ({
  planningPokerApi: { create: (...args: unknown[]) => mockCreateRoom(...args) },
}));

const mockDecks = [
  { id: 'deck-1', key: 'fibonacci', isDefault: true, cards: [] },
  { id: 'deck-2', key: 'tshirt', isDefault: false, cards: [] },
];

vi.mock('../usePlanningPoker', () => ({
  usePlanningPokerDecks: () => ({ data: mockDecks }),
}));

const mockClearRoom = vi.fn();
vi.mock('../../store/planningPokerStore', () => ({
  usePlanningPokerStore: (selector: unknown) => {
    const store = { clearRoom: mockClearRoom };
    return typeof selector === 'function' ? selector(store) : store;
  },
}));

describe('usePlanningPokerLobby', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide default deck from decks data', () => {
    const { result } = renderHook(() => usePlanningPokerLobby());

    expect(result.current.decks).toEqual(mockDecks);
    expect(result.current.createDeckId).toBe('deck-1');
  });

  it('should handle create room navigation', async () => {
    mockCreateRoom.mockResolvedValue({ id: 'new-room-id' });

    const { result } = renderHook(() => usePlanningPokerLobby());

    act(() => {
      result.current.setCreateTitle('Sprint 42');
    });

    await act(async () => {
      await result.current.handleCreateRoom();
    });

    expect(mockCreateRoom).toHaveBeenCalledWith({
      title: 'Sprint 42',
      password: undefined,
      deckId: 'deck-1',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/tools/planning-poker/new-room-id', {
      replace: true,
    });
  });

  it('should handle create room error', async () => {
    mockCreateRoom.mockRejectedValue(new Error('Room limit reached'));

    const { result } = renderHook(() => usePlanningPokerLobby());

    act(() => {
      result.current.setCreateTitle('Failing Room');
    });

    await act(async () => {
      await result.current.handleCreateRoom();
    });

    expect(result.current.actionError).toBe('Room limit reached');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should open and close create modal', () => {
    const { result } = renderHook(() => usePlanningPokerLobby());

    expect(result.current.createModalOpen).toBe(false);

    act(() => {
      result.current.handleOpenCreateModal();
    });

    expect(result.current.createModalOpen).toBe(true);

    act(() => {
      result.current.handleCloseCreateModal();
    });

    expect(result.current.createModalOpen).toBe(false);
  });
});
