import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomListFilters } from '../useRoomListFilters';
import type { RoomListItem } from '../types';

const rooms: (RoomListItem & { title: string })[] = [
  { id: '1', title: 'Sprint A', createdAt: '2026-01-01T00:00:00Z', isOwner: true, isAdmin: true },
  { id: '2', title: 'Sprint B', createdAt: '2026-02-01T00:00:00Z', isOwner: false, isAdmin: false },
  { id: '3', title: 'Alpha', createdAt: '2026-01-15T00:00:00Z', isOwner: true, isAdmin: false },
];

describe('useRoomListFilters', () => {
  it('returns all rooms when no filters are active', () => {
    const { result } = renderHook(() => useRoomListFilters(rooms));
    expect(result.current.filteredRooms).toHaveLength(3);
    expect(result.current.paginatedRooms).toHaveLength(3);
  });

  it('returns empty array when rooms is undefined', () => {
    const { result } = renderHook(() => useRoomListFilters(undefined));
    expect(result.current.filteredRooms).toEqual([]);
  });

  it('filters by search query', () => {
    const { result } = renderHook(() => useRoomListFilters(rooms));
    act(() => result.current.handleSearchChange('Sprint'));
    expect(result.current.filteredRooms).toHaveLength(2);
  });

  it('filters by date range', () => {
    const { result } = renderHook(() => useRoomListFilters(rooms));
    act(() => result.current.setDateFrom('2026-01-15'));
    act(() => result.current.setDateTo('2026-01-31'));
    expect(result.current.filteredRooms).toHaveLength(1);
    expect(result.current.filteredRooms[0]!.id).toBe('3');
  });

  it('filters by owner only', () => {
    const { result } = renderHook(() => useRoomListFilters(rooms));
    act(() => result.current.setOwnerOnly(true));
    expect(result.current.filteredRooms).toHaveLength(2);
  });

  it('filters by admin only', () => {
    const { result } = renderHook(() => useRoomListFilters(rooms));
    act(() => result.current.setAdminOnly(true));
    expect(result.current.filteredRooms).toHaveLength(1);
    expect(result.current.filteredRooms[0]!.id).toBe('1');
  });

  it('sorts by title ascending', () => {
    const { result } = renderHook(() => useRoomListFilters(rooms));
    act(() => result.current.handleSort('title'));
    expect(result.current.filteredRooms[0]!.title).toBe('Alpha');
    expect(result.current.filteredRooms[2]!.title).toBe('Sprint B');
  });

  it('toggles sort direction on same field', () => {
    const { result } = renderHook(() => useRoomListFilters(rooms));
    expect(result.current.sortDir).toBe('desc');
    act(() => result.current.handleSort('createdAt'));
    expect(result.current.sortDir).toBe('asc');
  });

  it('paginates results', () => {
    const manyRooms = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      title: `Room ${i}`,
      createdAt: new Date(2026, 0, i + 1).toISOString(),
      isOwner: false,
      isAdmin: false,
    }));
    const { result } = renderHook(() => useRoomListFilters(manyRooms));
    expect(result.current.paginatedRooms).toHaveLength(10);
    act(() => result.current.handleChangePage(null, 1));
    expect(result.current.paginatedRooms).toHaveLength(10);
    act(() => result.current.handleChangePage(null, 2));
    expect(result.current.paginatedRooms).toHaveLength(5);
  });

  it('resets to page 0 on search change', () => {
    const manyRooms = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      title: `Room ${i}`,
      createdAt: new Date(2026, 0, i + 1).toISOString(),
      isOwner: false,
      isAdmin: false,
    }));
    const { result } = renderHook(() => useRoomListFilters(manyRooms));
    act(() => result.current.handleChangePage(null, 1));
    expect(result.current.page).toBe(1);
    act(() => result.current.handleSearchChange('Room 1'));
    expect(result.current.page).toBe(0);
  });
});
