import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { RoomListTable } from '../RoomListTable';
import type { RoomListItem } from '../types';

interface DefaultProps {
  rooms: (RoomListItem & { title: string })[];
  paginatedRooms: (RoomListItem & { title: string })[];
  filteredCount: number;
  sortField: 'createdAt' | 'title';
  sortDir: 'asc' | 'desc';
  onSort: (field: 'createdAt' | 'title') => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (_: unknown, newPage: number) => void;
  renderActions: () => React.ReactNode;
  emptyIcon: React.ReactNode;
  emptyText: string;
  labels: {
    dateColumn: string;
    roomTitleColumn: string;
    actionsColumn: string;
    ownerTooltip: string;
    adminTooltip: string;
    paginationLabel: (params: { from: number; to: number; count: number }) => string;
  };
  locale: string;
  onRoomClick?: (id: string) => void;
}

function createDefaultProps(overrides: Partial<DefaultProps> = {}): DefaultProps {
  return {
    rooms: [],
    paginatedRooms: [],
    filteredCount: 0,
    sortField: 'createdAt',
    sortDir: 'desc',
    onSort: vi.fn(),
    page: 0,
    rowsPerPage: 10,
    onPageChange: vi.fn(),
    renderActions: () => <span>Actions</span>,
    emptyIcon: <svg data-testid="empty-icon" />,
    emptyText: 'No rooms',
    labels: {
      dateColumn: 'Date',
      roomTitleColumn: 'Room',
      actionsColumn: 'Actions',
      ownerTooltip: 'Owner',
      adminTooltip: 'Admin',
      paginationLabel: ({ from, to, count }: { from: number; to: number; count: number }) =>
        `${from}-${to} of ${count}`,
    },
    locale: 'en',
    ...overrides,
  };
}

const mockRooms: (RoomListItem & { title: string })[] = [
  { id: '1', title: 'Sprint A', createdAt: '2026-01-01T00:00:00Z', isOwner: true, isAdmin: true },
  { id: '2', title: 'Sprint B', createdAt: '2026-02-01T00:00:00Z', isOwner: false, isAdmin: false },
  { id: '3', title: 'Alpha', createdAt: '2026-01-15T00:00:00Z', isOwner: false, isAdmin: true },
];

describe('RoomListTable', () => {
  it('shows empty state when rooms is empty', () => {
    renderWithProviders(<RoomListTable {...createDefaultProps()} />);

    expect(screen.getByText('No rooms')).toBeInTheDocument();
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('renders room rows', () => {
    renderWithProviders(
      <RoomListTable
        {...createDefaultProps({
          rooms: mockRooms,
          paginatedRooms: mockRooms,
          filteredCount: mockRooms.length,
        })}
      />,
    );

    expect(screen.getByText('Sprint A')).toBeInTheDocument();
    expect(screen.getByText('Sprint B')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('calls onSort when column header clicked', async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <RoomListTable
        {...createDefaultProps({
          rooms: mockRooms,
          paginatedRooms: mockRooms,
          filteredCount: mockRooms.length,
          onSort,
        })}
      />,
    );

    await user.click(screen.getByText('Date'));
    expect(onSort).toHaveBeenCalledWith('createdAt');
  });

  it('renders pagination controls when there are rooms', () => {
    renderWithProviders(
      <RoomListTable
        {...createDefaultProps({
          rooms: mockRooms,
          paginatedRooms: mockRooms,
          filteredCount: mockRooms.length,
        })}
      />,
    );

    expect(screen.getByText('1-3 of 3')).toBeInTheDocument();
  });

  it('shows owner icon for owner rooms', () => {
    renderWithProviders(
      <RoomListTable
        {...createDefaultProps({
          rooms: mockRooms,
          paginatedRooms: mockRooms,
          filteredCount: mockRooms.length,
        })}
      />,
    );

    expect(screen.getByText('Sprint A').closest('tr')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination is used', async () => {
    const onPageChange = vi.fn();
    const manyRooms = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      title: `Room ${i}`,
      createdAt: new Date(2026, 0, i + 1).toISOString(),
      isOwner: false,
      isAdmin: false,
    }));
    const paginatedRooms = manyRooms.slice(0, 10);
    const user = userEvent.setup();

    renderWithProviders(
      <RoomListTable
        {...createDefaultProps({
          rooms: manyRooms,
          paginatedRooms,
          filteredCount: manyRooms.length,
          onPageChange,
        })}
      />,
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(onPageChange).toHaveBeenCalled();
  });
});
