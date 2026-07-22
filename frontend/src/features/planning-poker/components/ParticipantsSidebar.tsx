import { memo, useMemo } from 'react';
import { Typography, Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ParticipantRow } from './ParticipantRow';
import type { Participant, VoteItemState } from '../store/planningPokerStore';

export const ParticipantsSidebar = memo(function ParticipantsSidebar({
  participants,
  ownParticipantId,
  selectedVoteItem,
}: {
  participants: Participant[];
  ownParticipantId: string;
  selectedVoteItem: VoteItemState | null;
}) {
  const { t } = useTranslation();

  const votedParticipantIds = useMemo(
    () => new Set(selectedVoteItem?.votes.map((v) => v.participantId) ?? []),
    [selectedVoteItem?.votes],
  );

  return (
    <Box
      sx={{
        width: 240,
        borderLeft: 1,
        borderColor: 'divider',
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
        {t('planningPoker.participants')}
      </Typography>
      <Stack spacing={0.5} sx={{ minHeight: 0, overflow: 'auto', flex: 1 }}>
        {participants.map((p) => (
          <ParticipantRow
            key={p.id}
            p={p}
            ownParticipantId={ownParticipantId}
            votedParticipantIds={votedParticipantIds}
          />
        ))}
      </Stack>
    </Box>
  );
});
