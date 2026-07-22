import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import type { RoomState } from '../../store/kanbanStore';

const mockRoom: RoomState = {
  id: 'kanban-1',
  title: 'Sprint Board',
  createdAt: new Date().toISOString(),
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: true, isConnected: true },
    { id: 'p2', displayName: 'Bob', isOwner: false, isAdmin: false, isConnected: true },
  ],
  columns: [
    { id: 'col-1', title: 'To Do', description: null, displayOrder: 1 },
    { id: 'col-2', title: 'In Progress', description: null, displayOrder: 2 },
  ],
  cards: [
    { id: 'card-1', columnId: 'col-1', title: 'Task 1', description: null, authorParticipantId: 'p1', displayOrder: 1, assignedParticipantId: null, repoUrl: null, repoBranch: null, initialEstimation: null, remaining: null, dueAt: null, createdAt: new Date().toISOString(), comments: [] },
    { id: 'card-2', columnId: 'col-2', title: 'Task 2', description: null, authorParticipantId: 'p2', displayOrder: 1, assignedParticipantId: 'p2', repoUrl: null, repoBranch: null, initialEstimation: null, remaining: null, dueAt: null, createdAt: new Date().toISOString(), comments: [] },
  ],
  ownParticipantId: 'p1',
  hasPassword: false,
  version: 1,
};

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

let mockRoomData: {
  room: typeof mockRoom | null;
  connectionState: ConnectionState;
  storeError: string | null;
  setError: ReturnType<typeof vi.fn>;
  isOwner: boolean;
  isAdmin: boolean;
  columns: typeof mockRoom.columns;
  cardsByColumn: Map<string, typeof mockRoom.cards>;
  hasPassword: boolean;
} = {
  room: mockRoom,
  connectionState: 'connected',
  storeError: null,
  setError: vi.fn(),
  isOwner: true,
  isAdmin: true,
  columns: mockRoom.columns,
  cardsByColumn: new Map([
    ['col-1', [mockRoom.cards[0]!]],
    ['col-2', [mockRoom.cards[1]!]],
  ]),
  hasPassword: false,
};

const mockRoomActions = {
  actionError: null,
  setActionError: vi.fn(),
  snackbarError: null,
  setSnackbarError: vi.fn(),
  clearErrors: vi.fn(),
  pendingCardId: null,
  handleMoveCard: vi.fn(),
  handleAssignCard: vi.fn(),
  handleUpdatePassword: vi.fn(),
};

let mockKanbanStoreState: {
  roomClosedMessage: string | null;
  setRoomClosedMessage: ReturnType<typeof vi.fn>;
} = {
  roomClosedMessage: null,
  setRoomClosedMessage: vi.fn(),
};

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useParams: () => ({ roomId: 'kanban-1' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../hooks/useKanbanRoomData', () => ({
  useKanbanRoomData: () => mockRoomData,
}));

vi.mock('../../hooks/useKanbanRoomActions', () => ({
  useKanbanRoomActions: () => mockRoomActions,
}));

vi.mock('../../../../hooks/useCopyRoomLink', () => ({
  useCopyRoomLink: () => ({ copyLink: vi.fn() }),
}));

vi.mock('../../store/kanbanStore', () => ({
  useKanbanStore: (selector: (s: { roomClosedMessage: string | null; setRoomClosedMessage: ReturnType<typeof vi.fn> }) => unknown) =>
    selector(mockKanbanStoreState),
}));

vi.mock('../../../../components/feedback/SnackbarProvider', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

import { KanbanBoardPage } from '../KanbanBoardPage';

describe('KanbanBoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoomData = {
      room: mockRoom,
      connectionState: 'connected',
      storeError: null,
      setError: vi.fn(),
      isOwner: true,
      isAdmin: true,
      columns: mockRoom.columns,
      cardsByColumn: new Map([
        ['col-1', [mockRoom.cards[0]!]],
        ['col-2', [mockRoom.cards[1]!]],
      ]),
      hasPassword: false,
    };
    mockKanbanStoreState = {
      roomClosedMessage: null,
      setRoomClosedMessage: vi.fn(),
    };
  });

  it('renders board with columns', () => {
    renderWithProviders(<KanbanBoardPage />);
    expect(screen.getByText('Sprint Board')).toBeInTheDocument();
  });

  it('renders cards in columns', () => {
    renderWithProviders(<KanbanBoardPage />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('shows connecting state', () => {
    mockRoomData = { ...mockRoomData, connectionState: 'connecting' };
    renderWithProviders(<KanbanBoardPage />);
    expect(screen.getByText('kanban.reconnecting')).toBeInTheDocument();
  });

  it('shows disconnected state', () => {
    mockRoomData = { ...mockRoomData, connectionState: 'disconnected' };
    renderWithProviders(<KanbanBoardPage />);
    expect(screen.getByText('kanban.disconnected')).toBeInTheDocument();
  });

  it('shows loading state when no room', () => {
    mockRoomData = { ...mockRoomData, room: null };
    renderWithProviders(<KanbanBoardPage />);
    expect(screen.getByText('kanban.connecting')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockRoomData = { ...mockRoomData, storeError: 'Something went wrong' };
    renderWithProviders(<KanbanBoardPage />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows empty columns state when no columns', () => {
    mockRoomData = {
      ...mockRoomData,
      columns: [],
      cardsByColumn: new Map(),
    };
    renderWithProviders(<KanbanBoardPage />);
    expect(screen.getByText('kanban.noColumns')).toBeInTheDocument();
  });
});
