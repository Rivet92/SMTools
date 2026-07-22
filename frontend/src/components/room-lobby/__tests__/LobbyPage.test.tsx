import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseMutationResult } from '@tanstack/react-query';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { LobbyPage } from '../LobbyPage';
import type { RoomListItem } from '../types';

function createMockMutation(): UseMutationResult<unknown, Error, string> {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isIdle: true,
    isPending: false,
    isSuccess: false,
    isError: false,
    isPaused: false,
    data: undefined,
    error: null,
    status: 'idle',
    variables: undefined,
    submittedAt: 0,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    reset: vi.fn(),
    promise: Promise.resolve(undefined),
  } as unknown as UseMutationResult<unknown, Error, string>;
}

const mockRooms: (RoomListItem & { title: string })[] = [
  {
    id: 'room-1',
    title: 'Sprint 45',
    createdAt: new Date().toISOString(),
    isOwner: true,
    isAdmin: true,
  },
  {
    id: 'room-2',
    title: 'Sprint 46',
    createdAt: new Date().toISOString(),
    isOwner: false,
    isAdmin: false,
  },
];

describe('LobbyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and create button', () => {
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={mockRooms}
        isLoading={false}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    expect(screen.getByText('kanban.myRooms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'kanban.newRoom' })).toBeInTheDocument();
  });

  it('renders loading spinner when isLoading', () => {
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={undefined}
        isLoading={true}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error alert when error is present', () => {
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={undefined}
        isLoading={false}
        error={new Error('Failed to load rooms')}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    expect(screen.getByText('Failed to load rooms')).toBeInTheDocument();
  });

  it('renders room list when data is available', () => {
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={mockRooms}
        isLoading={false}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    expect(screen.getByText('Sprint 45')).toBeInTheDocument();
    expect(screen.getByText('Sprint 46')).toBeInTheDocument();
  });

  it('calls handleOpenCreateModal when create button is clicked', async () => {
    const handleOpenCreateModal = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={mockRooms}
        isLoading={false}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={handleOpenCreateModal}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'kanban.newRoom' }));
    expect(handleOpenCreateModal).toHaveBeenCalledOnce();
  });

  it('renders clickable room rows', () => {
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={mockRooms}
        isLoading={false}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    expect(screen.getByText('Sprint 45')).toBeInTheDocument();
    expect(screen.getByText('Sprint 46')).toBeInTheDocument();
  });

  it('renders empty state icon when no rooms', () => {
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={[]}
        isLoading={false}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    expect(screen.getByText('kanban.noRooms')).toBeInTheDocument();
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('shows delete dialog when delete button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={mockRooms}
        isLoading={false}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'kanban.delete' });
    await user.click(deleteButtons[0]!);
    expect(screen.getByText('kanban.deleteRoomTitle')).toBeInTheDocument();
  });

  it('shows delete dialog title when delete button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LobbyPage
        feature="kanban"
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        EmptyIcon={() => <svg data-testid="empty-icon" />}
        roomRoute={(id) => `/tools/kanban/${id}`}
        rooms={mockRooms}
        isLoading={false}
        error={null}
        deleteForMe={createMockMutation()}
        deleteForEveryone={createMockMutation()}
        createRoomModal={<div>Create modal</div>}
        handleOpenCreateModal={vi.fn()}
      />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'kanban.delete' });
    await user.click(deleteButtons[0]!);
    expect(await screen.findByText('kanban.deleteRoomTitle')).toBeInTheDocument();
    expect(await screen.findByText('kanban.deleteRoomConfirm')).toBeInTheDocument();
  });
});
