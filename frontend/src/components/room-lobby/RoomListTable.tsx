import type { ReactNode } from 'react';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconCrown, IconShield } from '@tabler/icons-react';
import { formatRoomDate, formatRoomTime } from './formatRoomDate';
import type { RoomListItem, SortDir, SortField } from './types';

interface RoomListTableProps {
  rooms: RoomListItem[];
  paginatedRooms: RoomListItem[];
  filteredCount: number;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (_: unknown, newPage: number) => void;
  renderActions: (room: RoomListItem) => ReactNode;
  onRoomClick?: (roomId: string) => void;
  emptyIcon: ReactNode;
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
}

export function RoomListTable({
  rooms,
  paginatedRooms,
  filteredCount,
  sortField,
  sortDir,
  onSort,
  page,
  rowsPerPage,
  onPageChange,
  renderActions,
  onRoomClick,
  emptyIcon,
  emptyText,
  labels,
  locale,
}: RoomListTableProps) {
  if (rooms.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          {emptyIcon}
          <Typography variant="h6" color="text.secondary">
            {emptyText}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, py: 0.5, width: 0, whiteSpace: 'nowrap' }}>
              <TableSortLabel
                active={sortField === 'createdAt'}
                direction={sortField === 'createdAt' ? sortDir : 'asc'}
                onClick={() => onSort('createdAt')}
              >
                {labels.dateColumn}
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 0.5, width: '100%' }}>
              <TableSortLabel
                active={sortField === 'title'}
                direction={sortField === 'title' ? sortDir : 'asc'}
                onClick={() => onSort('title')}
              >
                {labels.roomTitleColumn}
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 0.5, width: 0, whiteSpace: 'nowrap' }}>
              {labels.actionsColumn}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRooms.map((room) => (
            <TableRow key={room.id} sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
              <TableCell sx={{ py: 1, whiteSpace: 'nowrap', width: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '1rem' }}>
                  {formatRoomDate(room.createdAt, locale)} {formatRoomTime(room.createdAt, locale)}
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 1, width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: onRoomClick ? 'pointer' : undefined,
                    ...(onRoomClick && { '&:hover': { textDecoration: 'underline' } }),
                  }}
                  onClick={onRoomClick ? () => onRoomClick(room.id) : undefined}
                >
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '1rem' }}>
                    {room.title}
                  </Typography>
                  {room.isOwner && (
                    <Tooltip title={labels.ownerTooltip}>
                      <Box sx={{ display: 'flex', color: 'warning.main' }}>
                        <IconCrown size={14} />
                      </Box>
                    </Tooltip>
                  )}
                  {room.isAdmin && !room.isOwner && (
                    <Tooltip title={labels.adminTooltip}>
                      <Box sx={{ display: 'flex', color: 'primary.main' }}>
                        <IconShield size={14} />
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
              <TableCell sx={{ py: 1, whiteSpace: 'nowrap', width: 0 }} align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  {renderActions(room)}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={filteredCount}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        labelDisplayedRows={({ from, to, count }) => labels.paginationLabel({ from, to, count })}
      />
    </TableContainer>
  );
}
