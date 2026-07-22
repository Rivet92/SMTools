import { memo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../store/planningPokerStore';

export const ParticipantRow = memo(function ParticipantRow({
  p,
  ownParticipantId,
  votedParticipantIds,
}: {
  p: Participant;
  ownParticipantId: string;
  votedParticipantIds: Set<string>;
}) {
  const { t } = useTranslation();

  const nameColor = p.isOwner ? 'success.main' : p.isAdmin ? 'primary.main' : 'text.secondary';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.25,
        borderRadius: 1,
        opacity: p.isConnected ? 1 : 0.5,
      }}
    >
      <Typography
        variant="body2"
        noWrap
        sx={{
          flex: 1,
          fontWeight: p.id === ownParticipantId ? 700 : undefined,
          color: nameColor,
        }}
      >
        {p.displayName}
      </Typography>
      {votedParticipantIds.has(p.id) && (
        <Tooltip title={t('planningPoker.hasVoted')}>
          <Box
            sx={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconCheck size={16} style={{ color: 'var(--mui-palette-success-main)' }} />
          </Box>
        </Tooltip>
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
  );
});
