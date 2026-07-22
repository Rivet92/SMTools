import { useState, useCallback } from 'react';
import { Box, Typography, List, IconButton } from '@mui/material';
import { IconArrowLeft, IconUsers } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ParticipantRow } from './ParticipantRow';
import { KickConfirmDialog } from './KickConfirmDialog';
export interface ParticipantBase {
  id: string;
  displayName: string;
  isOwner: boolean;
  isAdmin: boolean;
  isConnected: boolean;
}

export interface ParticipantsManagerProps<TParticipant extends ParticipantBase> {
  participants: TParticipant[];
  ownParticipantId: string;
  canManage: boolean;
  isOwner: boolean;
  callbacks: {
    onMakeAdmin: (participantId: string) => void;
    onRemoveAdmin: (participantId: string) => void;
    onRemoveParticipant?: (participantId: string) => void;
    onGoBack: () => void;
  };
  pending: {
    makeAdminId: string | null;
    removeAdminId: string | null;
    removeParticipantId?: string | null;
  };
  featureKey: string;
  getVoteStatus?: (participantId: string) => boolean;
}

export function ParticipantsManager<TParticipant extends ParticipantBase>({
  participants,
  ownParticipantId,
  canManage,
  isOwner,
  callbacks,
  pending,
  featureKey,
  getVoteStatus,
}: ParticipantsManagerProps<TParticipant>) {
  const { t } = useTranslation();
  const [kickCandidateId, setKickCandidateId] = useState<string | null>(null);

  const connectedCount = participants.filter((p) => p.isConnected).length;

  const kickCandidate = kickCandidateId ? participants.find((p) => p.id === kickCandidateId) : null;

  const handleKickConfirm = useCallback(() => {
    if (kickCandidateId && callbacks.onRemoveParticipant) {
      callbacks.onRemoveParticipant(kickCandidateId);
    }
    setKickCandidateId(null);
  }, [kickCandidateId, callbacks]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton size="small" onClick={callbacks.onGoBack} aria-label={t('common.back')}>
          <IconArrowLeft size={20} />
        </IconButton>
        <IconUsers size={20} />
        <Typography variant="h6" sx={{ flex: 1 }}>
          {t(`${featureKey}.participants`)} ({connectedCount}/{participants.length})
        </Typography>
      </Box>

      <List dense sx={{ flex: 1, overflow: 'auto', px: 0 }}>
        {participants.map((p) => {
          const isOwn = p.id === ownParticipantId;
          const canManageAdmin = isOwner && !p.isOwner && !isOwn;
          const canKick = canManage && !p.isOwner && !p.isAdmin && !isOwn;
          const isAdminPending = pending.makeAdminId === p.id || pending.removeAdminId === p.id;
          const isKickPending = pending.removeParticipantId === p.id;
          const hasVoted = getVoteStatus?.(p.id);

          return (
            <ParticipantRow
              key={p.id}
              participant={p}
              isOwn={isOwn}
              canManageAdmin={canManageAdmin}
              canKick={canKick}
              isAdminPending={isAdminPending}
              isKickPending={isKickPending}
              hasVoted={hasVoted}
              onMakeAdmin={() => callbacks.onMakeAdmin(p.id)}
              onRemoveAdmin={() => callbacks.onRemoveAdmin(p.id)}
              onKick={() => setKickCandidateId(p.id)}
              featureKey={featureKey}
            />
          );
        })}
      </List>

      <KickConfirmDialog
        open={kickCandidateId !== null}
        participantName={kickCandidate?.displayName ?? ''}
        featureKey={featureKey}
        onConfirm={handleKickConfirm}
        onCancel={() => setKickCandidateId(null)}
      />
    </Box>
  );
}
