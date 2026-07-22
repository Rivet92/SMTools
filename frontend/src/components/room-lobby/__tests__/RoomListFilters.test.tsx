import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { RoomListFilters } from '../RoomListFilters';

const defaultLabels = {
  searchPlaceholder: 'Search rooms',
  fromDate: 'From date',
  toDate: 'To date',
  ownerOnly: 'My rooms',
  adminOnly: 'Admin only',
};

describe('RoomListFilters', () => {
  it('renders search input and filter toggle button', () => {
    renderWithProviders(
      <RoomListFilters
        search=""
        onSearchChange={vi.fn()}
        showFilters={false}
        onToggleFilters={vi.fn()}
        dateFrom=""
        onDateFromChange={vi.fn()}
        dateTo=""
        onDateToChange={vi.fn()}
        ownerOnly={false}
        onOwnerOnlyChange={vi.fn()}
        adminOnly={false}
        onAdminOnlyChange={vi.fn()}
        labels={defaultLabels}
      />,
    );

    expect(screen.getByPlaceholderText('Search rooms')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders date range pickers when filters are visible', () => {
    renderWithProviders(
      <RoomListFilters
        search=""
        onSearchChange={vi.fn()}
        showFilters={true}
        onToggleFilters={vi.fn()}
        dateFrom=""
        onDateFromChange={vi.fn()}
        dateTo=""
        onDateToChange={vi.fn()}
        ownerOnly={false}
        onOwnerOnlyChange={vi.fn()}
        adminOnly={false}
        onAdminOnlyChange={vi.fn()}
        labels={defaultLabels}
      />,
    );

    expect(screen.getByLabelText('From date')).toBeInTheDocument();
    expect(screen.getByLabelText('To date')).toBeInTheDocument();
    expect(screen.getByLabelText('My rooms')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin only')).toBeInTheDocument();
  });

  it('shows filter icon when filters are hidden', () => {
    renderWithProviders(
      <RoomListFilters
        search=""
        onSearchChange={vi.fn()}
        showFilters={false}
        onToggleFilters={vi.fn()}
        dateFrom=""
        onDateFromChange={vi.fn()}
        dateTo=""
        onDateToChange={vi.fn()}
        ownerOnly={false}
        onOwnerOnlyChange={vi.fn()}
        adminOnly={false}
        onAdminOnlyChange={vi.fn()}
        labels={defaultLabels}
      />,
    );

    expect(screen.getByPlaceholderText('Search rooms')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <RoomListFilters
        search=""
        onSearchChange={onSearchChange}
        showFilters={false}
        onToggleFilters={vi.fn()}
        dateFrom=""
        onDateFromChange={vi.fn()}
        dateTo=""
        onDateToChange={vi.fn()}
        ownerOnly={false}
        onOwnerOnlyChange={vi.fn()}
        adminOnly={false}
        onAdminOnlyChange={vi.fn()}
        labels={defaultLabels}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search rooms'), 'test');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('calls onOwnerOnlyChange when toggle is clicked', async () => {
    const onOwnerOnlyChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <RoomListFilters
        search=""
        onSearchChange={vi.fn()}
        showFilters={true}
        onToggleFilters={vi.fn()}
        dateFrom=""
        onDateFromChange={vi.fn()}
        dateTo=""
        onDateToChange={vi.fn()}
        ownerOnly={false}
        onOwnerOnlyChange={onOwnerOnlyChange}
        adminOnly={false}
        onAdminOnlyChange={vi.fn()}
        labels={defaultLabels}
      />,
    );

    await user.click(screen.getByLabelText('My rooms'));
    expect(onOwnerOnlyChange).toHaveBeenCalledWith(true);
  });

  it('calls onToggleFilters when filter button clicked', async () => {
    const onToggleFilters = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <RoomListFilters
        search=""
        onSearchChange={vi.fn()}
        showFilters={false}
        onToggleFilters={onToggleFilters}
        dateFrom=""
        onDateFromChange={vi.fn()}
        dateTo=""
        onDateToChange={vi.fn()}
        ownerOnly={false}
        onOwnerOnlyChange={vi.fn()}
        adminOnly={false}
        onAdminOnlyChange={vi.fn()}
        labels={defaultLabels}
      />,
    );

    await user.click(screen.getByRole('button'));
    expect(onToggleFilters).toHaveBeenCalledOnce();
  });
});
