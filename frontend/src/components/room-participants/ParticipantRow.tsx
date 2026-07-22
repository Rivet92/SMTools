import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  IconCrown,
  IconShield,
  IconUser,
  IconUserMinus,
  IconCheck,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ParticipantBase } from './ParticipantsManager';

interface ParticipantRowProps {
  participant: ParticipantBase;
  isOwn: boolean;
  canManageAdmin: boolean;
  canKick: boolean;
  isAdminPending: boolean;
  isKickPending: boolean;
  hasVoted: boolean | undefined;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
  onKick: () => void;
  featureKey: string;
}

export function ParticipantRow({
  participant: p,
  isOwn,
  canManageAdmin,
  canKick,
  isAdminPending,
  isKickPending,
  hasVoted,
  onMakeAdmin,
  onRemoveAdmin,
  onKick,
  featureKey,
}: ParticipantRowProps) {
  const { t } = useTranslation();

  return (
    <ListItem
      sx={{
        opacity: p.isConnected ? 1 : 0.55,
        bgcolor: isOwn ? 'action.selected' : 'transparent',
      }}
    >
      <ListItemAvatar>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: p.isOwner ? 'warning.main' : 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {p.displayName.charAt(0).toUpperCase()}
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: isOwn ? 600 : 400 }}>
              {p.displayName}
            </Typography>
            {isOwn && (
              <Typography variant="caption" color="text.secondary">
                ({t(`${featureKey}.you`)})
              </Typography>
            )}
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            {p.isOwner && (
              <Chip
                size="small"
                icon={<IconCrown size={14} />}
                label={t(`${featureKey}.owner`)}
                color="warning"
                variant="outlined"
              />
            )}
            {!p.isOwner && p.isAdmin && (
              <Chip
                size="small"
                icon={<IconShield size={14} />}
                label={t(`${featureKey}.admin`)}
                color="primary"
                variant="outlined"
              />
            )}
            {!p.isConnected && (
              <Typography variant="caption" color="text.secondary">
                {t('retro.offline')}
              </Typography>
            )}
            {hasVoted && (
              <IconCheck size={14} style={{ color: 'var(--mui-palette-success-main)' }} />
            )}
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: p.isConnected ? 'success.main' : 'grey.400',
                flexShrink: 0,
              }}
            />
          </Box>
        }
      />
      <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {canManageAdmin &&
          (p.isAdmin ? (
            <Tooltip title={t(`${featureKey}.removeAdmin`)}>
              <IconButton
                size="small"
                disabled={isAdminPending}
                onClick={onRemoveAdmin}
                sx={{ color: 'primary.main' }}
              >
                {isAdminPending ? <CircularProgress size={16} /> : <IconShield size={16} />}
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t(`${featureKey}.makeAdmin`)}>
              <IconButton
                size="small"
                disabled={isAdminPending}
                onClick={onMakeAdmin}
              >
                {isAdminPending ? <CircularProgress size={16} /> : <IconUser size={16} />}
              </IconButton>
            </Tooltip>
          ))}
        {canKick && (
          <Tooltip title={t(`${featureKey}.removeParticipant`)}>
            <IconButton
              size="small"
              disabled={isKickPending}
              onClick={onKick}
              sx={{ color: 'error.main' }}
            >
              {isKickPending ? <CircularProgress size={16} /> : <IconUserMinus size={16} />}
            </IconButton>
          </Tooltip>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
}
