import { useState } from 'react';
import { Alert, Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../seo/components/PageHead';
import { PageHeader } from '../../../components/PageHeader';
import { ConfirmDialog } from '../../../components/room-lobby/ConfirmDialog';
import { useKanbanCardForm } from '../hooks/useKanbanCardForm';
import { RoomLoadingState } from '../../../components/room-lobby/RoomLoadingState';
import { CardMetaFields } from '../components/CardMetaFields';
import { MarkdownEditor, MarkdownPreview } from '../../../components/markdown';

export function KanbanCardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    room,
    card,
    isNew,
    roomId,
    actionError,
    setActionError,
    handleDeleteCard,
    title,
    description,
    repoUrl,
    repoBranch,
    initialEstimation,
    remaining,
    dueAt,
    assignedParticipantId,
    handleAssignedParticipantChange,
    saveStatus,
    isEditing,
    setIsEditing,
    handleTitleChange,
    handleDescriptionChange,
    setRepoUrl,
    setRepoBranch,
    setInitialEstimation,
    setRemaining,
    setDueAt,
    makeFieldChangeHandler,
    makeNumericHandler,
    isValidUrl,
  } = useKanbanCardForm();

  if (!room) {
    return (
      <>
        <PageHead title={t('seo.kanban.title')} description={t('seo.kanban.description')} />
        <RoomLoadingState seoTitleKey="seo.kanban.title" seoDescriptionKey="seo.kanban.description" connectingKey="kanban.connecting" />
      </>
    );
  }

  if (!card && !isNew) {
    return (
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PageHead title={t('seo.kanban.title')} description={t('seo.kanban.description')} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">{t('kanban.cardNotFound')}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <PageHead
        title={isNew ? t('kanban.addCard') : `${card!.title} \u00b7 ${t('seo.kanban.title')}`}
        description={t('seo.kanban.description')}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          title={isNew ? t('kanban.addCard') : t('kanban.editCard')}
          onBack={() => navigate(`/tools/kanban/${roomId}`)}
          backAriaLabel={t('kanban.aria.back')}
          variant="h6"
        >
          {!isNew && (
            <Tooltip
              title={t('kanban.deleteCard')}
              PopperProps={{
                modifiers: [
                  { name: 'flip', enabled: true },
                  { name: 'preventOverflow', enabled: true },
                ],
              }}
            >
              <IconButton
                size="small"
                color="error"
                aria-label={t('kanban.aria.deleteCard')}
                onClick={() => setConfirmDelete(true)}
              >
                <IconTrash size={20} />
              </IconButton>
            </Tooltip>
          )}
        </PageHeader>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', p: 2 }}>
          {actionError && (
            <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
            <TextField
              autoFocus
              label={t('kanban.cardTitleLabel')}
              value={title}
              onChange={handleTitleChange}
              fullWidth
              size="small"
              disabled={!isEditing}
            />
            {!isNew && (
              <Tooltip
                title={t(isEditing ? 'notes.preview' : 'notes.edit')}
                PopperProps={{
                  modifiers: [
                    { name: 'flip', enabled: true },
                    { name: 'preventOverflow', enabled: true },
                  ],
                }}
              >
                <Button
                  variant={isEditing ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setIsEditing((prev) => !prev)}
                  sx={{
                    width: 40,
                    minWidth: 40,
                    height: 40,
                    minHeight: 40,
                    px: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isEditing ? <IconEye size={22} /> : <IconEdit size={22} />}
                </Button>
              </Tooltip>
            )}
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {t('kanban.cardDescriptionLabel')}
          </Typography>

          {isEditing ? (
            <Box sx={{ flex: 1, minHeight: 0, mb: 2, display: 'flex', flexDirection: 'column' }}>
              <MarkdownEditor
                value={description}
                onChange={handleDescriptionChange}
                placeholder=""
                minRows={8}
                editing
                saveStatus={saveStatus}
                fillHeight
                autoFocus={!isNew}
              />
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                '& > *:first-child': { mt: 0 },
              }}
            >
              {description.trim() ? (
                <MarkdownPreview content={description} />
              ) : (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {t('kanban.noDescription')}
                </Typography>
              )}
            </Box>
          )}

          <CardMetaFields
            isEditing={isEditing}
            repoUrl={repoUrl}
            repoBranch={repoBranch}
            assignedParticipantId={assignedParticipantId}
            initialEstimation={initialEstimation}
            remaining={remaining}
            dueAt={dueAt}
            participants={room.participants}
            onRepoUrlChange={makeFieldChangeHandler(setRepoUrl)}
            onRepoBranchChange={makeFieldChangeHandler(setRepoBranch)}
            onAssignedChange={handleAssignedParticipantChange}
            onInitialEstimationChange={makeNumericHandler(setInitialEstimation)}
            onRemainingChange={makeNumericHandler(setRemaining)}
            onDueAtChange={makeFieldChangeHandler(setDueAt)}
            isValidUrl={isValidUrl}
          />
        </Box>

        <ConfirmDialog
          open={confirmDelete}
          title={t('kanban.deleteCard')}
          message={t('kanban.confirmDeleteCard')}
          confirmLabel={t('kanban.deleteCard')}
          destructive
          onConfirm={() => {
            handleDeleteCard(card!.id);
            setConfirmDelete(false);
            navigate(`/tools/kanban/${roomId}`);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      </Box>
    </>
  );
}
