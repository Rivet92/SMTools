import { useCallback, useMemo, useState } from 'react';
import type { RoomListItem, SortDir, SortField } from './types';

const ROWS_PER_PAGE = 10;

export function useRoomListFilters(rooms: RoomListItem[] | undefined) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [ownerOnly, setOwnerOnly] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    let result = [...rooms];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }

    if (ownerOnly) {
      result = result.filter((r) => r.isOwner);
    }

    if (adminOnly) {
      result = result.filter((r) => r.isAdmin);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((r) => new Date(r.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((r) => new Date(r.createdAt) <= to);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [rooms, search, ownerOnly, adminOnly, dateFrom, dateTo, sortField, sortDir]);

  const paginatedRooms = useMemo(
    () => filteredRooms.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE),
    [filteredRooms, page],
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir(field === 'createdAt' ? 'desc' : 'asc');
      }
      setPage(0);
    },
    [sortField],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    search,
    setSearch,
    handleSearchChange,
    showFilters,
    setShowFilters,
    ownerOnly,
    setOwnerOnly,
    adminOnly,
    setAdminOnly,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortField,
    sortDir,
    handleSort,
    page,
    rowsPerPage: ROWS_PER_PAGE,
    handleChangePage,
    filteredRooms,
    paginatedRooms,
  };
}
