import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import type { UseMutationResult } from '@tanstack/react-query';

const mockDeleteForMe = { mutate: vi.fn() } as unknown as UseMutationResult<unknown, Error, string>;
const mockDeleteForEveryone = { mutate: vi.fn() } as unknown as UseMutationResult<unknown, Error, string>;

vi.mock('../../hooks/useKanbanLobby', () => ({
  useKanbanLobby: () => ({
    createModalOpen: false,
    handleOpenCreateModal: vi.fn(),
    handleCloseCreateModal: vi.fn(),
    createTitle: '',
    setCreateTitle: vi.fn(),
    createPassword: '',
    setCreatePassword: vi.fn(),
    creating: false,
    actionError: null,
    setActionError: vi.fn(),
    handleCreateRoom: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMyKanbanRooms', () => ({
  useMyKanbanRooms: () => ({
    data: [
      {
        id: '1',
        title: 'Sprint 1',
        createdAt: '2026-01-01T00:00:00Z',
        isOwner: true,
        isAdmin: true,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useDeleteKanbanRoomMutations', () => ({
  useDeleteKanbanRoomMutations: () => ({
    deleteForMe: mockDeleteForMe,
    deleteForEveryone: mockDeleteForEveryone,
  }),
}));

import { KanbanLobbyPage } from '../KanbanLobbyPage';

describe('KanbanLobbyPage', () => {
  it('renders lobby with kanban-specific title', () => {
    renderWithProviders(<KanbanLobbyPage />);

    expect(screen.getByText('kanban.myRooms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'kanban.newRoom' })).toBeInTheDocument();
  });
});
