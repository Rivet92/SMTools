/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useKanbanStore } from '../../store/kanbanStore';

const mockHub = vi.hoisted(() => ({
  addColumn: vi.fn(),
  updateColumn: vi.fn(),
  deleteColumn: vi.fn(),
  reorderColumns: vi.fn(),
  addCard: vi.fn(),
  updateCard: vi.fn(),
  moveCard: vi.fn(),
  assignCard: vi.fn(),
  deleteCard: vi.fn(),
  makeAdmin: vi.fn(),
  removeAdmin: vi.fn(),
  removeParticipant: vi.fn(),
  updateRoomPassword: vi.fn(),
}));

const mockAdminActions = vi.hoisted(() => ({
  handleUpdatePassword: vi.fn(),
  handleMakeAdmin: vi.fn(),
  handleRemoveAdmin: vi.fn(),
}));

vi.mock('../../kanbanHub', () => mockHub);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('../../../hooks/useRoomAdminActions', () => ({
  useRoomAdminActions: () => ({
    ...mockAdminActions,
    pendingMakeAdminId: null,
    pendingRemoveAdminId: null,
  }),
}));

const { useKanbanRoomActions } = await import('../useKanbanRoomActions');

const mockRoom: any = {
  id: 'r1',
  title: 'Test',
  ownParticipantId: 'p1',
  hasPassword: false,
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: true, isConnected: true },
  ],
  columns: [],
  cards: [],
};

describe('useKanbanRoomActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useKanbanStore.setState({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
    });
  });

  it('returns initial state with no errors', () => {
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    expect(result.current.actionError).toBeNull();
    expect(result.current.snackbarError).toBeNull();
    expect(result.current.pendingColumnId).toBeNull();
    expect(result.current.pendingCardId).toBeNull();
  });

  it('handleAddColumn calls addColumn on hub', async () => {
    mockHub.addColumn.mockResolvedValue(undefined);
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    await result.current.handleAddColumn('New Column');
    expect(mockHub.addColumn).toHaveBeenCalledWith('New Column', undefined);
  });

  it('handleAddCard calls addCard on hub', async () => {
    mockHub.addCard.mockResolvedValue(undefined);
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    await result.current.handleAddCard('col-1', 'New Card');
    expect(mockHub.addCard).toHaveBeenCalledWith(
      'col-1',
      'New Card',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('handleMoveCard calls moveCard on hub', async () => {
    mockHub.moveCard.mockResolvedValue(undefined);
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    await result.current.handleMoveCard('card-1', 'col-2', 1);
    expect(mockHub.moveCard).toHaveBeenCalledWith('card-1', 'col-2', 1);
  });

  it('handleDeleteCard calls deleteCard on hub', async () => {
    mockHub.deleteCard.mockResolvedValue(undefined);
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    await result.current.handleDeleteCard('card-1');
    expect(mockHub.deleteCard).toHaveBeenCalledWith('card-1');
  });

  it('handleUpdateCard calls updateCard on hub', async () => {
    mockHub.updateCard.mockResolvedValue(undefined);
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    await result.current.handleUpdateCard('card-1', 'Updated Title');
    expect(mockHub.updateCard).toHaveBeenCalledWith(
      'card-1',
      'Updated Title',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('handleAssignCard calls assignCard on hub', async () => {
    mockHub.assignCard.mockResolvedValue(undefined);
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    await result.current.handleAssignCard('card-1', 'p2');
    expect(mockHub.assignCard).toHaveBeenCalledWith('card-1', 'p2');
  });

  it('delegates admin actions to useRoomAdminActions', () => {
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    expect(result.current.pendingMakeAdminId).toBeNull();
    expect(result.current.pendingRemoveAdminId).toBeNull();
  });

  it('sets actionError when hub call fails (rethrow=true)', async () => {
    mockHub.addColumn.mockRejectedValue(new Error('Failed'));
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    await expect(result.current.handleAddColumn('New Column')).rejects.toThrow('Failed');
    await waitFor(() => {
      expect(result.current.actionError).toBe('kanban.errors.addColumn');
    });
  });

  it('clearErrors resets both errors', () => {
    useKanbanStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useKanbanRoomActions());
    result.current.setActionError('error1');
    result.current.setSnackbarError('error2');
    result.current.clearErrors();
    expect(result.current.actionError).toBeNull();
    expect(result.current.snackbarError).toBeNull();
  });
});
