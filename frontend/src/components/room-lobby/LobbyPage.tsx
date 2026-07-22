import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { IconPlus, IconLink, IconTrash } from '@tabler/icons-react';
import { PageHeader } from '../PageHeader';
import type { UseMutationResult } from '@tanstack/react-query';
import { PageHead } from '../seo/PageHead';
import { DeleteRoomDialog, RoomListFilters, RoomListTable, useRoomListFilters } from '.';
import type { RoomListItem } from './types';

interface LobbyPageProps {
  feature: string;
  seoTitleKey: string;
  seoDescriptionKey: string;
  EmptyIcon: React.ComponentType<{ size?: number; stroke?: number }>;
  roomRoute: (roomId: string) => string;
  rooms: (RoomListItem & { title: string })[] | undefined;
  isLoading: boolean;
  error: Error | null;
  deleteForMe: UseMutationResult<unknown, Error, string>;
  deleteForEveryone: UseMutationResult<unknown, Error, string>;
  createRoomModal: ReactNode;
  handleOpenCreateModal: () => void;
}

export function LobbyPage({
  feature,
  seoTitleKey,
  seoDescriptionKey,
  EmptyIcon,
  roomRoute,
  rooms,
  isLoading,
  error,
  deleteForMe,
  deleteForEveryone,
  createRoomModal,
  handleOpenCreateModal,
}: LobbyPageProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === 'es-ES' ? 'es-ES' : 'en';

  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const filters = useRoomListFilters(rooms);
  const selectedRoom = rooms?.find((r) => r.id === roomToDelete);

  return (
    <>
      <PageHead title={t(seoTitleKey)} description={t(seoDescriptionKey)} />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <PageHeader title={t(`${feature}.myRooms`)} backTo="/tools">
          <Tooltip title={t(`${feature}.newRoom`)}>
            <IconButton
              size="small"
              onClick={handleOpenCreateModal}
              aria-label={t(`${feature}.newRoom`)}
            >
              <IconPlus size={20} />
            </IconButton>
          </Tooltip>
        </PageHeader>

        <Box sx={{ pt: 1.5 }}>
          <RoomListFilters
            search={filters.search}
            onSearchChange={filters.handleSearchChange}
            showFilters={filters.showFilters}
            onToggleFilters={() => filters.setShowFilters((p) => !p)}
            dateFrom={filters.dateFrom}
            onDateFromChange={filters.setDateFrom}
            dateTo={filters.dateTo}
            onDateToChange={filters.setDateTo}
            ownerOnly={filters.ownerOnly}
            onOwnerOnlyChange={filters.setOwnerOnly}
            adminOnly={filters.adminOnly}
            onAdminOnlyChange={filters.setAdminOnly}
            labels={{
              searchPlaceholder: t(`${feature}.searchRooms`) as string,
              fromDate: t(`${feature}.fromDate`) as string,
              toDate: t(`${feature}.toDate`) as string,
              ownerOnly: t(`${feature}.ownerOnly`) as string,
              adminOnly: t(`${feature}.adminOnly`) as string,
            }}
          />

          {isLoading && (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}

          {!isLoading && !error && (
            <RoomListTable
              rooms={filters.filteredRooms}
              paginatedRooms={filters.paginatedRooms}
              filteredCount={filters.filteredRooms.length}
              sortField={filters.sortField}
              sortDir={filters.sortDir}
              onSort={filters.handleSort}
              page={filters.page}
              rowsPerPage={filters.rowsPerPage}
              onPageChange={filters.handleChangePage}
              onRoomClick={(id) => navigate(roomRoute(id))}
              emptyIcon={<EmptyIcon size={48} stroke={1} />}
              emptyText={t(`${feature}.noRooms`)}
              locale={locale}
              labels={{
                dateColumn: t(`${feature}.dateColumn`),
                roomTitleColumn: t(`${feature}.roomTitleLabel`),
                actionsColumn: t(`${feature}.actions`),
                ownerTooltip: t(`${feature}.owner`),
                adminTooltip: t(`${feature}.admin`),
                paginationLabel: ({ from, to, count }) =>
                  t(`${feature}.paginationLabel`, { from, to, count }),
              }}
              renderActions={(room) => (
                <>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setRoomToDelete(room.id)}
                    aria-label={t(`${feature}.delete`)}
                  >
                    <IconTrash size={20} />
                  </IconButton>
                  <Tooltip
                    title={copiedRoomId === room.id ? t('common.copied') : t('roomHeader.copyLink')}
                  >
                    <IconButton
                      size="small"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          `${window.location.origin}${roomRoute(room.id)}`,
                        );
                        setCopiedRoomId(room.id);
                        setTimeout(() => setCopiedRoomId(null), 2000);
                      }}
                      aria-label={t('roomHeader.copyLink')}
                    >
                      <IconLink size={20} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            />
          )}
        </Box>
      </Box>

      <DeleteRoomDialog
        open={roomToDelete !== null}
        onClose={() => setRoomToDelete(null)}
        isOwner={selectedRoom?.isOwner ?? false}
        deleteForMe={deleteForMe}
        deleteForEveryone={deleteForEveryone}
        onDeleteForMe={() => {
          if (roomToDelete) deleteForMe.mutate(roomToDelete);
          setRoomToDelete(null);
        }}
        onDeleteForEveryone={() => {
          if (roomToDelete) deleteForEveryone.mutate(roomToDelete);
          setRoomToDelete(null);
        }}
        labels={{
          title: t(`${feature}.deleteRoomTitle`),
          confirmText: t(`${feature}.deleteRoomConfirm`),
          cancel: t(`${feature}.cancel`),
          deleteForMe: t(`${feature}.deleteForMe`),
          deleteForEveryone: t(`${feature}.deleteForEveryone`),
          delete: t(`${feature}.delete`),
        }}
      />

      {createRoomModal}
    </>
  );
}
