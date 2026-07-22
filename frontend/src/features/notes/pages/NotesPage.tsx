import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  IconNotes,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPlus,
} from '@tabler/icons-react';
import { GenericDialog } from '../../../components/GenericDialog';
import { PageHeader } from '../../../components/PageHeader';
import { useTranslation } from 'react-i18next';
import { PageHead } from '../../seo/components/PageHead';
import { NotesSidebar } from '../components/NotesSidebar';
import { NoteEditorToolbar } from '../components/NoteEditorToolbar';
import { NoteEditorContent } from '../components/NoteEditorContent';
import { useNotesData } from '../hooks/useNotesData';
import { useNoteSelection } from '../hooks/useNoteSelection';
import { useNoteEditor } from '../hooks/useNoteEditor';
import { useNoteDragAndDrop } from '../hooks/useNoteDragAndDrop';
import { useSnackbar } from '../../../components/feedback/SnackbarProvider';
import type { Note } from '../../../types/models/notes';
import type { UpdateNoteRequest } from '../../../api/notes';

export function NotesPage() {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingNote, setPendingNote] = useState<{ id: string } | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const { notes, isLoading, error, create, update, remove, toggleArchive, reorder } =
    useNotesData();
  const { selectedNoteId, selectedNote, selectNote, handleCreateNote, handleDeleteNote } =
    useNoteSelection({ notes });

  const activeNotes = useMemo(() => notes?.filter((n) => !n.isArchived) ?? [], [notes]);
  const archivedNotes = useMemo(() => notes?.filter((n) => n.isArchived) ?? [], [notes]);

  const editorNote = useMemo((): Note | null => {
    if (selectedNote) return selectedNote;
    if (pendingNote)
      return { id: pendingNote.id, userId: '', title: '', content: '', isArchived: false, position: 0, createdAt: '', updatedAt: '' };
    return null;
  }, [selectedNote, pendingNote]);

  const handleSave = useCallback(
    async (noteId: string, request: UpdateNoteRequest) => {
      if (pendingNote && noteId === pendingNote.id) {
        if (!request.title && !request.content) return;
        const note = await create.mutateAsync({ title: request.title ?? '', content: request.content ?? '' });
        setPendingNote(null);
        handleCreateNote(note);
      } else {
        await update.mutateAsync({ noteId, request });
      }
    },
    [pendingNote, create, update, handleCreateNote],
  );

  const { title, content, dirty, saveStatus, setTitle, setContent, saveNow } = useNoteEditor({
    note: editorNote,
    onSave: handleSave,
  });

  const handleSelectNote = useCallback(
    async (note: Note) => {
      if (pendingNote) {
        if (dirty) await saveNow();
        setPendingNote(null);
      } else if (dirty && selectedNoteId) {
        saveNow();
      }
      selectNote(note.id);
      setIsEditing(false);
    },
    [pendingNote, dirty, selectedNoteId, saveNow, selectNote],
  );

  const handleCreate = useCallback(() => {
    setPendingNote({ id: crypto.randomUUID() });
    setIsEditing(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      remove.mutate(deleteTarget);
      handleDeleteNote(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, remove, handleDeleteNote]);

  const mutationError = useMemo(() => {
    if (update.error) return t('notes.errors.save', { message: update.error.message });
    if (remove.error) return t('notes.errors.delete', { message: remove.error.message });
    if (toggleArchive.error) return t('notes.errors.archive', { message: toggleArchive.error.message });
    if (reorder.error) return t('notes.errors.reorder', { message: reorder.error.message });
    return null;
  }, [update.error, remove.error, toggleArchive.error, reorder.error, t]);

  const clearMutationErrors = useCallback(() => {
    update.reset();
    remove.reset();
    toggleArchive.reset();
    reorder.reset();
  }, [update, remove, toggleArchive, reorder]);

  const { sensors, collisionDetection, measuring, activeIds, archivedIds, handleDragEnd } =
    useNoteDragAndDrop({ activeNotes, archivedNotes, onReorder: reorder.mutate });

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (mutationError) {
      enqueueSnackbar({ message: mutationError, severity: 'error', autoHideDuration: 6000, onClose: clearMutationErrors });
    }
  }, [mutationError, enqueueSnackbar, clearMutationErrors]);

  const handleToggleSidebar = useCallback(() => setShowSidebar((prev) => !prev), []);

  const textareaId = 'note-content-textarea';

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById(textareaId)?.focus();
    }
  }, []);

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <PageHead title={t('seo.notes.title')} description={t('seo.notes.description')} />
      <PageHeader title={t('notes.title')} backTo="/tools" backAriaLabel={t('notes.aria.back')}>
        <Tooltip title={t('notes.toggleSidebar')}>
          <IconButton size="small" onClick={handleToggleSidebar} aria-label={t('notes.toggleSidebar')} sx={{ color: 'text.secondary' }}>
            {showSidebar ? <IconLayoutSidebarLeftCollapse size={20} /> : <IconLayoutSidebarLeftExpand size={20} />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('notes.newNote')}>
          <IconButton size="small" onClick={handleCreate} aria-label={t('notes.newNote')}>
            <IconPlus size={20} />
          </IconButton>
        </Tooltip>
      </PageHeader>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mt: 1 }}>{error.message}</Alert>}

      {notes && notes.length === 0 && !pendingNote ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
          <Stack alignItems="center" spacing={2}>
            <IconNotes size={48} stroke={1} />
            <Typography variant="h6" color="text.secondary">{t('notes.noNotes')}</Typography>
          </Stack>
        </Box>
      ) : notes ? (
        <Box sx={{ flex: 1, display: 'flex', overflow: 'auto', minHeight: 0 }}>
          <Collapse orientation="horizontal" in={showSidebar} sx={{ height: '100%' }}>
            <NotesSidebar
              activeNotes={activeNotes}
              archivedNotes={archivedNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={handleSelectNote}
              sensors={sensors}
              collisionDetection={collisionDetection}
              measuring={measuring}
              activeIds={activeIds}
              archivedIds={archivedIds}
              handleDragEnd={handleDragEnd}
            />
          </Collapse>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {(selectedNote || pendingNote) ? (
              <>
                <NoteEditorToolbar
                  title={title}
                  onTitleChange={(e) => setTitle(e.target.value)}
                  isArchived={selectedNote?.isArchived ?? false}
                  isEditing={isEditing}
                  onToggleEdit={() => setIsEditing((prev) => !prev)}
                  onToggleArchive={() => selectedNote && toggleArchive.mutate(selectedNote.id)}
                  onDelete={() => selectedNote && setDeleteTarget(selectedNote.id)}
                  isUpdatePending={update.isPending}
                  isRemovePending={remove.isPending}
                  autoFocusTitle={Boolean(pendingNote)}
                  onTitleKeyDown={handleTitleKeyDown}
                />
                <NoteEditorContent
                  content={content}
                  onContentChange={setContent}
                  isEditing={isEditing}
                  placeholder={t('notes.contentPlaceholder')}
                  noContentMessage={t('notes.noContent')}
                  saveStatus={saveStatus}
                  textareaId={textareaId}
                />
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">{t('notes.selectNote')}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : null}

      <GenericDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('notes.deleteConfirm')}
        actions={
          <>
            <Button onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button onClick={confirmDelete} color="error" variant="contained" disabled={remove.isPending}>
              {t('notes.delete')}
            </Button>
          </>
        }
      />
    </Box>
  );
}
