import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { IconChevronLeft, IconChevronRight, IconThumbUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { RoomHeader as SharedRoomHeader } from '../../../components/room-header/RoomHeader';
import { PHASES, RetroPhase } from '../../../types/models/retro';

export function RoomHeader({
  roomTitle,
  phase,
  phaseName,
  hasPassword,
  canManage,
  connectedCount,
  totalParticipants,
  onCopyLink,
  onNextPhase,
  onPreviousPhase,
  onOpenParticipants,
  onChangePassword,
  remainingVotePoints,
  totalVotePoints: totalVotePointsProp,
}: {
  roomTitle: string;
  phase: RetroPhase;
  phaseName: string;
  hasPassword: boolean;
  canManage: boolean;
  connectedCount: number;
  totalParticipants: number;
  onCopyLink: () => void;
  onNextPhase: () => void;
  onPreviousPhase: () => void;
  onOpenParticipants: () => void;
  onChangePassword?: () => void;
  remainingVotePoints?: number;
  totalVotePoints?: number;
}) {
  const { t } = useTranslation();

  const phaseIndex = PHASES.indexOf(phase);
  const canGoBack = phaseIndex > 0;
  const canGoForward = phaseIndex >= 0 && phaseIndex < PHASES.length - 1;

  return (
    <SharedRoomHeader
      roomTitle={roomTitle}
      backRoute="/tools/retro"
      hasPassword={hasPassword}
      canManage={canManage}
      totalParticipants={totalParticipants}
      connectedCount={connectedCount}
      onCopyLink={onCopyLink}
      onManagePassword={onChangePassword ?? (() => {})}
      onOpenParticipants={onOpenParticipants}
      passwordTooltip={t('retro.passwordManage')}
      noPasswordTooltip={t('retro.passwordOptional')}
      endActions={
        phase === RetroPhase.Voting &&
        remainingVotePoints !== undefined &&
        totalVotePointsProp !== undefined ? (
          <Tooltip title={t('retro.votesAvailable')}>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
                fontSize: '0.75rem',
                px: 0.75,
              }}
            >
              <IconThumbUp size={18} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {remainingVotePoints}/{totalVotePointsProp}
              </Typography>
            </Box>
          </Tooltip>
        ) : undefined
      }
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        {canManage && (
          <Tooltip title={t('retro.previousPhase')}>
            <span>
              <IconButton
                size="small"
                onClick={onPreviousPhase}
                disabled={!canGoBack}
                aria-label={t('retro.aria.previousPhase')}
              >
                <IconChevronLeft size={18} />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Chip label={phaseName} size="small" color="primary" variant="outlined" />
        {canManage && (
          <Tooltip title={t('retro.nextPhase')}>
            <span>
              <IconButton
                size="small"
                onClick={onNextPhase}
                disabled={!canGoForward}
                aria-label={t('retro.aria.nextPhase')}
              >
                <IconChevronRight size={18} />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </SharedRoomHeader>
  );
}
