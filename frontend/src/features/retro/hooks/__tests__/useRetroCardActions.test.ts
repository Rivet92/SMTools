import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRetroStore } from '../../store/retroStore';
import type { RoomState } from '../../store/retroStore';

const mockHub = vi.hoisted(() => ({
  deleteCard: vi.fn(),
  createGroupFromCards: vi.fn(),
  moveCardToGroup: vi.fn(),
}));

vi.mock('../../retroHub', () => mockHub);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const { useRetroCardActions } = await import('../useRetroCardActions');

const createRoom = (overrides: Partial<RoomState> = {}): RoomState => ({
  id: 'r1',
  title: 'Test Retro',
  ownParticipantId: 'p1',
  hasPassword: false,
  phase: 'Gathering',
  templateId: 'tpl-1',
  columns: [],
  cards: [],
  groups: [],
  actionItems: [],
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: true, isConnected: true },
  ],
  createdAt: new Date().toISOString(),
  version: 1,
  ...overrides,
});

describe('useRetroCardActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRetroStore.setState({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
      lastVersion: 0,
    });
  });

  it('handleDeleteCard calls deleteCard on hub', async () => {
    mockHub.deleteCard.mockResolvedValue(undefined);
    useRetroStore.setState({ room: createRoom() });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroCardActions(setActionError));
    await result.current.handleDeleteCard('card-1');
    expect(mockHub.deleteCard).toHaveBeenCalledWith('card-1');
  });

  it('handleCreateGroupFromCards calls createGroupFromCards on hub', async () => {
    mockHub.createGroupFromCards.mockResolvedValue(undefined);
    useRetroStore.setState({ room: createRoom() });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroCardActions(setActionError));
    await result.current.handleCreateGroupFromCards('card-1', 'card-2', 'Group Title');
    expect(mockHub.createGroupFromCards).toHaveBeenCalledWith('Group Title', 'card-1', 'card-2');
  });

  it('handleMoveCardToGroup calls moveCardToGroup on hub', async () => {
    mockHub.moveCardToGroup.mockResolvedValue(undefined);
    useRetroStore.setState({ room: createRoom() });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroCardActions(setActionError));
    await result.current.handleMoveCardToGroup('card-1', 'group-1');
    expect(mockHub.moveCardToGroup).toHaveBeenCalledWith('card-1', 'group-1');
  });
});
