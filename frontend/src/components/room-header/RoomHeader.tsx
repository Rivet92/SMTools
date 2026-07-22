import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import { IconArrowLeft, IconLink, IconLock, IconLockOpen, IconUsers } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface RoomHeaderProps {
  roomTitle: string;
  backRoute: string;
  hasPassword: boolean;
  canManage: boolean;
  totalParticipants: number;
  connectedCount?: number;
  onCopyLink: () => void;
  onManagePassword: () => void;
  onOpenParticipants: () => void;
  passwordTooltip?: string;
  noPasswordTooltip?: string;
  endActions?: React.ReactNode;
  children?: React.ReactNode;
}

export function RoomHeader({
  roomTitle,
  backRoute,
  hasPassword,
  canManage,
  totalParticipants,
  connectedCount,
  onCopyLink,
  onManagePassword,
  onOpenParticipants,
  passwordTooltip,
  noPasswordTooltip,
  endActions,
  children,
}: RoomHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const lockTooltip = hasPassword
    ? (passwordTooltip ?? t('roomHeader.passwordManage'))
    : (noPasswordTooltip ?? t('roomHeader.passwordSet'));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        py: 1,
        px: 1,
        borderBottom: 1,
        borderColor: 'divider',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>
        <IconButton
          size="small"
          onClick={() => navigate(backRoute)}
          aria-label={t('roomHeader.aria.back')}
        >
          <IconArrowLeft size={20} />
        </IconButton>
        <Typography variant="h6" noWrap>
          {roomTitle}
        </Typography>
        {canManage ? (
          <Tooltip title={lockTooltip}>
            <IconButton
              size="small"
              onClick={onManagePassword}
              aria-label={lockTooltip}
              sx={{
                color: hasPassword ? 'warning.main' : 'text.secondary',
                p: 0.25,
                flexShrink: 0,
              }}
            >
              {hasPassword ? <IconLock size={18} /> : <IconLockOpen size={18} />}
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title={lockTooltip}>
            <Box
              sx={{
                display: 'flex',
                color: hasPassword ? 'warning.main' : 'text.secondary',
                flexShrink: 0,
              }}
            >
              {hasPassword ? <IconLock size={18} /> : <IconLockOpen size={18} />}
            </Box>
          </Tooltip>
        )}
      </Box>

      {children && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {children}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
        {endActions}
        {canManage ? (
          <Tooltip title={t('roomHeader.participants')}>
            <IconButton
              size="small"
              onClick={onOpenParticipants}
              aria-label={t('roomHeader.participants')}
              sx={{ color: 'text.secondary', gap: 0.25, borderRadius: 1.5 }}
            >
              <IconUsers size={18} />
              {connectedCount !== undefined ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {connectedCount}/{totalParticipants}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {totalParticipants}
                </Typography>
              )}
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title={t('roomHeader.participants')}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                color: 'text.secondary',
                px: 1,
              }}
            >
              <IconUsers size={18} />
              {connectedCount !== undefined ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {connectedCount}/{totalParticipants}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {totalParticipants}
                </Typography>
              )}
            </Box>
          </Tooltip>
        )}
        <Tooltip title={t('roomHeader.copyLink')}>
          <IconButton
            size="small"
            onClick={onCopyLink}
            aria-label={t('roomHeader.copyLink')}
            sx={{ color: 'text.secondary' }}
          >
            <IconLink size={18} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
