import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  DialogContentText,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconClock, IconDownload, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconPhotoEdit, IconTrash, IconUpload, IconUser } from '@tabler/icons-react';
import { GenericDialog } from '../../../components/GenericDialog';
import { PageHeader } from '../../../components/PageHeader';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHead } from '../../seo/components/PageHead';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUpdateProfile, useExportData, useDeleteAccount, useUploadAvatar, useAuditLog } from '../hooks/useProfile';
import type { AuditEntryDto } from '../api/profile';

const SIDEBAR_ITEMS = [
  { key: 0, icon: IconUser },
  { key: 1, icon: IconClock },
  { key: 2, icon: IconDownload },
  { key: 3, icon: IconTrash },
] as const;

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#2e7d32',
  UPDATE: '#1976d2',
  DELETE: '#d32f2f',
};

function AuditRow({ entry }: { entry: AuditEntryDto }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const color = ACTION_COLORS[entry.action] ?? 'text.secondary';
  const date = new Date(entry.timestamp).toLocaleString();
  const hasValues = !!(entry.oldValues || entry.newValues);

  return (
    <>
      <TableRow
        hover
        onClick={() => hasValues && setExpanded((p) => !p)}
        sx={{ cursor: hasValues ? 'pointer' : 'default' }}
      >
        <TableCell>
          <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
            {entry.action}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            {entry.entityType}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {entry.entityId.slice(0, 8)}...
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2">{date}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            {entry.ipAddress ?? '—'}
          </Typography>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={4} sx={{ pb: 2 }}>
            {entry.oldValues && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">{t('profile.activityOldValues')}</Typography>
                <Box component="pre" sx={{ m: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', p: 1, borderRadius: 1 }}>
                  {JSON.stringify(JSON.parse(entry.oldValues), null, 2)}
                </Box>
              </Box>
            )}
            {entry.newValues && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t('profile.activityNewValues')}</Typography>
                <Box component="pre" sx={{ m: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', p: 1, borderRadius: 1 }}>
                  {JSON.stringify(JSON.parse(entry.newValues), null, 2)}
                </Box>
              </Box>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [name, setName] = useState(user?.name ?? '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const exportMutation = useExportData();
  const deleteMutation = useDeleteAccount();
  const [auditPage, setAuditPage] = useState(0);
  const { data: auditData, isLoading: auditLoading } = useAuditLog(auditPage + 1);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: name !== user?.name ? name : undefined,
    });
  };

  const validateFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png'].includes(ext)) {
      return t('profile.errors.avatarType');
    }
    if (file.size > 2 * 1024 * 1024) {
      return t('profile.errors.avatarSize');
    }
    return null;
  }, [t]);

  const handleFileSelected = useCallback((file: File) => {
    setValidationError(null);
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    URL.revokeObjectURL(previewUrl ?? '');
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  }, [validateFile, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileSelected(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUploadConfirm = () => {
    if (!selectedFile) return;
    uploadAvatarMutation.mutate(selectedFile, {
      onSuccess: () => {
        handleCloseAvatarDialog();
      },
    });
  };

  const handleCloseAvatarDialog = () => {
    setAvatarDialogOpen(false);
    setDragOver(false);
    setValidationError(null);
    URL.revokeObjectURL(previewUrl ?? '');
    setPreviewUrl(null);
    setSelectedFile(null);
    uploadAvatarMutation.reset();
  };

  const handleRemoveAvatar = () => {
    updateProfileMutation.mutate({ avatarUrl: '' });
  };

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smtools-export-${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  const handleDeleteAccount = () => {
    deleteMutation.mutate();
  };

  const avatarLetter = user?.avatarUrl
    ? undefined
    : (user?.name?.[0] ?? '?').toUpperCase();

  const noChanges = name === user?.name;

  const handleOpenDeleteDialog = () => {
    setConfirmText('');
    setDeleteDialogOpen(true);
  };

  const confirmPhrase = t('profile.deleteConfirmPhrase', { username: user?.name ?? '' });
  const canDelete = confirmText === confirmPhrase;

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <PageHead title={t('profile.title')} description={t('profile.description')} />

      <PageHeader title={t('profile.title')} backTo="/tools">
        <Tooltip title={t('profile.toggleSidebar')}>
          <IconButton
            size="small"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={t('profile.toggleSidebar')}
            sx={{ color: 'text.secondary' }}
          >
            {sidebarOpen ? (
              <IconLayoutSidebarLeftCollapse size={20} />
            ) : (
              <IconLayoutSidebarLeftExpand size={20} />
            )}
          </IconButton>
        </Tooltip>
      </PageHeader>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'auto', minHeight: 0 }}>
        <Collapse orientation="horizontal" in={sidebarOpen}>
          <Box
            sx={{
              width: 220,
              borderRight: 1,
              borderColor: 'divider',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            {SIDEBAR_ITEMS.map(({ key, icon: Icon }) => {
              const isActive = activeSection === key;
              const isDelete = key === 3;
              return (
                <Box
                  key={key}
                  onClick={() => setActiveSection(key)}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    color: isDelete && isActive ? 'error.main' : 'text.primary',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Icon size={20} />
                  <Typography variant="body2">
                    {key === 0 ? t('profile.editSection') : key === 1 ? t('profile.activitySection') : key === 2 ? t('profile.exportSection') : t('profile.deleteSection')}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Collapse>

        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {activeSection === 0 && (
            <Stack spacing={3} sx={{ width: '100%' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ position: 'relative' }}>
                  <Box
                    onClick={() => setAvatarDialogOpen(true)}
                    sx={{
                      position: 'relative',
                      display: 'inline-flex',
                      cursor: 'pointer',
                      '&:hover .avatar-overlay': { opacity: 1 },
                    }}
                  >
                    <Avatar
                      src={user?.avatarUrl}
                      alt={user?.name}
                      sx={{ width: 56, height: 56 }}
                    >
                      {avatarLetter}
                    </Avatar>
                    <Box
                      className="avatar-overlay"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <IconPhotoEdit size={20} color="white" />
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6">{user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('profile.provider')}: {user?.provider}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2} sx={{ width: '100%' }}>
                <TextField
                  label={t('profile.nameLabel')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={updateProfileMutation.isPending}
                />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending || noChanges}
                  >
                    {updateProfileMutation.isPending
                      ? t('common.saving')
                      : t('common.save')}
                  </Button>
                  {uploadAvatarMutation.isError && (
                    <Typography variant="caption" color="error">
                      {t('profile.errors.uploadAvatar')}
                    </Typography>
                  )}
                  {updateProfileMutation.isError && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {t('profile.errors.update')}
                    </Typography>
                  )}
                  {updateProfileMutation.isSuccess && (
                    <Typography variant="caption" color="success.main" sx={{ ml: 2 }}>
                      {t('profile.saved')}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Stack>
          )}

          {activeSection === 1 && (
            <Box maxWidth={960}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.activityDescription')}
              </Typography>

              {auditLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : !auditData?.items.length ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  {t('profile.activityEmpty')}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>{t('profile.activityColAction')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('profile.activityColEntity')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('profile.activityColTime')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('profile.activityColIp')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditData.items.map((entry) => (
                        <AuditRow key={entry.id} entry={entry} />
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TablePagination
                          count={auditData.totalCount}
                          page={auditPage}
                          onPageChange={(_, newPage) => setAuditPage(newPage)}
                          rowsPerPage={auditData.pageSize}
                          rowsPerPageOptions={[]}
                        />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {activeSection === 2 && (
            <Box maxWidth={640}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.exportDescription')}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleExport}
                disabled={exportMutation.isPending}
                startIcon={
                  exportMutation.isPending
                    ? <CircularProgress size={16} />
                    : <IconDownload size={16} />
                }
              >
                {exportMutation.isPending
                  ? t('profile.exporting')
                  : t('profile.exportButton')}
              </Button>
              {exportMutation.isError && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  {t('profile.errors.export')}
                </Typography>
              )}
            </Box>
          )}

          {activeSection === 3 && (
            <Box maxWidth={640}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.deleteDescription')}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={handleOpenDeleteDialog}
                disabled={deleteMutation.isPending}
              >
                {t('profile.deleteButton')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <GenericDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={t('profile.deleteConfirmTitle')}
        titleId="delete-account-dialog-title"
        actions={
          <>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDeleteAccount}
              color="error"
              variant="contained"
              disabled={!canDelete || deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t('profile.deleting')
                : t('profile.deleteConfirmButton')}
            </Button>
          </>
        }
      >
        <DialogContentText sx={{ mb: 2 }}>
          {t('profile.deleteConfirmText')}
        </DialogContentText>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('profile.deleteConfirmInstructions', { phrase: confirmPhrase })}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder={confirmPhrase}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={deleteMutation.isPending}
        />
      </GenericDialog>

      <GenericDialog
        open={avatarDialogOpen}
        onClose={handleCloseAvatarDialog}
        title={t('profile.avatarDialogTitle')}
        actions={
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <Box>
              {user?.avatarUrl && !selectedFile && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    handleRemoveAvatar();
                    handleCloseAvatarDialog();
                  }}
                  disabled={updateProfileMutation.isPending}
                >
                  {t('profile.removeAvatar')}
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={handleCloseAvatarDialog} disabled={uploadAvatarMutation.isPending}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadConfirm}
                disabled={!selectedFile || uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending
                  ? t('common.saving')
                  : t('profile.avatarUploadButton')}
              </Button>
            </Box>
          </Box>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('profile.avatarDialogHint')}
        </Typography>

        <Stack spacing={2} alignItems="center">
          <Avatar
            src={previewUrl || user?.avatarUrl}
            alt={user?.name}
            sx={{ width: 96, height: 96 }}
          >
            {avatarLetter}
          </Avatar>

          <Box
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              width: '100%',
              minHeight: 120,
              border: 2,
              borderStyle: 'dashed',
              borderColor: dragOver ? 'primary.main' : 'divider',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              cursor: 'pointer',
              bgcolor: dragOver ? 'action.hover' : 'transparent',
              transition: 'all 0.2s',
              p: 2,
            }}
          >
            <IconUpload size={32} color={dragOver ? 'primary.main' : undefined} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {t('profile.avatarDropHint')}
            </Typography>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {validationError && (
            <Typography variant="caption" color="error">
              {validationError}
            </Typography>
          )}
          {uploadAvatarMutation.isError && (
            <Typography variant="caption" color="error">
              {t('profile.errors.uploadAvatar')}
            </Typography>
          )}
        </Stack>
      </GenericDialog>
    </Box>
  );
}
