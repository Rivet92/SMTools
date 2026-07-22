import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, IconButton, Typography } from '@mui/material';

import { IconEdit, IconEye, IconPlus } from '@tabler/icons-react';
import { PageHead } from '../../seo/components/PageHead';
import { PageHeader } from '../../../components/PageHeader';
import { useKanbanRoomData } from '../hooks/useKanbanRoomData';
import { useKanbanRoomActions } from '../hooks/useKanbanRoomActions';
import { useColumnDragReorder } from '../hooks/useColumnDragReorder';
import { useColumnDeleteDialog } from '../hooks/useColumnDeleteDialog';
import { RoomLoadingState } from '../../../components/room-lobby/RoomLoadingState';
import { ColumnEditor } from '../components/ColumnEditor';
import { ColumnList } from '../components/ColumnList';
import { DeleteColumnDialog } from '../components/DeleteColumnDialog';

export function KanbanBoardConfigPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  const { room, isAdmin, columns, cardsByColumn } = useKanbanRoomData();

  useEffect(() => {
    if (room && !isAdmin) {
      navigate(`/tools/kanban/${roomId}`);
    }
  }, [room, isAdmin, navigate, roomId]);

  const {
    pendingColumnId,
    handleAddColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    handleReorderColumns,
  } = useKanbanRoomActions();

  const { displayColumns, handleDragStart, handleDragOver, handleDragEnd } = useColumnDragReorder(
    columns,
    handleReorderColumns,
  );

  const {
    deleteCandidate,
    targetColumnId,
    setTargetColumnId,
    handleRequestDelete,
    handleConfirmDelete,
    handleCancelDelete,
    candidateCardCount,
    otherColumns,
  } = useColumnDeleteDialog(columns, cardsByColumn, handleDeleteColumn);

  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  const validSelectedId =
    selectedColumnId && columns.some((c) => c.id === selectedColumnId)
      ? selectedColumnId
      : columns.length > 0
        ? columns[0]!.id
        : null;

  const selectedColumn = useMemo<(typeof columns)[number] | null>(
    () => columns.find((c) => c.id === validSelectedId) ?? null,
    [columns, validSelectedId],
  );

  const justAddedRef = useRef(false);
  const prevColumnsLengthRef = useRef(columns.length);
  useEffect(() => {
    if (columns.length > prevColumnsLengthRef.current && justAddedRef.current) {
      const lastColumn = columns[columns.length - 1];
      if (lastColumn) setSelectedColumnId(lastColumn.id);
      justAddedRef.current = false;
    }
    prevColumnsLengthRef.current = columns.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length]);

  const handleGoBack = useCallback(() => {
    navigate(`/tools/kanban/${roomId}`);
  }, [navigate, roomId]);

  const handleAddEmptyColumn = useCallback(async () => {
    justAddedRef.current = true;
    await handleAddColumn('', '');
  }, [handleAddColumn]);

  const handleSaveEdit = useCallback(
    async (title: string, description: string) => {
      if (!validSelectedId) return;
      const trimmedTitle = title.trim();
      const trimmedDesc = description.trim();
      if (trimmedTitle) {
        await handleUpdateColumn(validSelectedId, trimmedTitle, trimmedDesc || undefined);
      }
    },
    [validSelectedId, handleUpdateColumn],
  );

  const handleSelectColumn = useCallback((columnId: string) => {
    setSelectedColumnId(columnId);
  }, []);

  if (!room) {
    return (
      <>
        <PageHead title={t('kanban.settings')} description={t('seo.kanban.description')} />
        <RoomLoadingState seoTitleKey="seo.kanban.title" seoDescriptionKey="seo.kanban.description" connectingKey="kanban.connecting" />
      </>
    );
  }

  return (
    <>
      <PageHead
        title={`${t('kanban.settings')} · ${room.title}`}
        description={t('seo.kanban.description')}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          title={t('kanban.settings')}
          onBack={handleGoBack}
          backAriaLabel={t('kanban.aria.back')}
          variant="h6"
        >
          <Button
            variant="contained"
            size="small"
            onClick={handleAddEmptyColumn}
            startIcon={<IconPlus size={16} />}
            sx={{ fontSize: '0.75rem' }}
          >
            {t('kanban.addColumn')}
          </Button>
        </PageHeader>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Box
            sx={{
              width: 320,
              minWidth: 320,
              borderRight: 1,
              borderColor: 'divider',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, color: 'text.secondary' }}>
              {t('kanban.columns')} ({displayColumns.length})
            </Typography>
            <ColumnList
              columns={displayColumns}
              cardsByColumn={cardsByColumn}
              selectedColumnId={validSelectedId}
              pendingColumnId={pendingColumnId}
              onSelectColumn={handleSelectColumn}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onRequestDelete={handleRequestDelete}
            />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                {t('kanban.editColumn')}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setIsEditing((p) => !p)}
                aria-label={t('kanban.aria.editToggle')}
              >
                {isEditing ? <IconEye size={18} /> : <IconEdit size={18} />}
              </IconButton>
            </Box>
            {selectedColumn ? (
              <Box sx={{ px: 2, pb: 2 }}>
                <ColumnEditor
                  key={selectedColumn.id}
                  column={selectedColumn}
                  editing={isEditing}
                  onSave={handleSaveEdit}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography color="text.secondary">{t('kanban.noColumnSelected')}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <DeleteColumnDialog
        deleteCandidate={deleteCandidate}
        targetColumnId={targetColumnId}
        onTargetColumnIdChange={setTargetColumnId}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        candidateCardCount={candidateCardCount}
        otherColumns={otherColumns}
        pendingColumnId={pendingColumnId}
      />
    </>
  );
}
