import { memo, useCallback } from 'react';
import {
  Typography,
  Box,
  ButtonBase,
  Paper,
  Stack,
  Grid2,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  IconClipboardText,
  IconEye,
  IconEyeOff,
  IconRefreshDot,
  IconCheck,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { VoteItemState } from '../store/planningPokerStore';
import type { PlanningPokerCard } from '../../../types/models/planning-poker';

export const VoteArea = memo(function VoteArea({
  voteItem,
  ownParticipantId,
  canManage,
  cards,
  onVote,
  onReveal,
  onHide,
  onReset,
  isVoting,
  isRevealing,
  isHiding,
  isResetting,
}: {
  voteItem: VoteItemState | null;
  ownParticipantId: string;
  canManage: boolean;
  cards: PlanningPokerCard[];
  onVote: (value: string) => Promise<void>;
  onReveal: () => Promise<void>;
  onHide: () => Promise<void>;
  onReset: () => Promise<void>;
  isVoting: boolean;
  isRevealing: boolean;
  isHiding: boolean;
  isResetting: boolean;
}) {
  const { t } = useTranslation();

  const handleVote = useCallback(
    async (cardValue: string) => {
      if (!voteItem || voteItem.isRevealed || isVoting) return;
      await onVote(cardValue);
    },
    [voteItem, isVoting, onVote],
  );

  if (!voteItem) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <IconClipboardText size={48} stroke={1} />
          <Typography variant="h6" color="text.secondary">
            {t('planningPoker.selectItem')}
          </Typography>
        </Stack>
      </Box>
    );
  }

  const myVote = voteItem.votes.find((v) => v.participantId === ownParticipantId);
  const voteCount = voteItem.votes.length;
  const isRevealed = voteItem.isRevealed;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">{voteItem.title}</Typography>
        {canManage && (
          <Stack direction="row" spacing={1}>
            {isRevealed ? (
              <>
                <Tooltip title={t('planningPoker.reset')}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={onReset}
                      disabled={isResetting}
                      sx={{ color: 'text.secondary' }}
                    >
                      <IconRefreshDot size={20} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={t('planningPoker.hide')}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={onHide}
                      disabled={isHiding}
                      sx={{ color: 'text.secondary' }}
                    >
                      <IconEyeOff size={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            ) : (
              <Tooltip title={t('planningPoker.reveal')}>
                <span>
                  <IconButton
                    size="small"
                    onClick={onReveal}
                    disabled={voteCount === 0 || isRevealing}
                    sx={{ color: 'text.secondary' }}
                  >
                    <IconEye size={20} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        )}
      </Stack>

      <Collapse in={isRevealed && voteCount > 0}>
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('planningPoker.results')}
          </Typography>
          <Grid2 container spacing={1}>
            {voteItem.votes.map((vr) => (
              <Grid2 key={vr.participantId}>
                <Paper
                  variant="outlined"
                  sx={{ px: 2, py: 1, textAlign: 'center', bgcolor: 'action.hover' }}
                >
                  <Typography variant="h6">{vr.value ?? '●'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {vr.participantName}
                  </Typography>
                </Paper>
              </Grid2>
            ))}
          </Grid2>
        </Paper>
      </Collapse>

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          {t('planningPoker.chooseCard')}
        </Typography>
        <Grid2 container spacing={1.5}>
          {cards.map((card) => {
            const isSelected = myVote?.value === card.value;
            const isDisabled = isRevealed || isVoting;
            return (
              <Grid2 key={card.value}>
                <ButtonBase
                  focusRipple
                  disabled={isDisabled}
                  aria-label={t('planningPoker.voteCardAriaLabel', { value: card.value })}
                  aria-pressed={isSelected}
                  sx={{
                    width: 72,
                    height: 96,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isSelected ? 'primary.main' : 'background.paper',
                    color: isSelected ? 'primary.contrastText' : 'text.primary',
                    border: 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: isDisabled ? 'none' : 'scale(1.05)',
                    },
                    '&.Mui-disabled': {
                      opacity: isRevealed ? 0.6 : 0.4,
                      transform: 'none',
                    },
                  }}
                  onClick={() => handleVote(card.value)}
                >
                  <Stack alignItems="center" spacing={0.5}>
                    <Typography variant="h5" fontWeight={700}>
                      {card.value}
                    </Typography>
                    {isSelected && <IconCheck size={16} />}
                  </Stack>
                </ButtonBase>
              </Grid2>
            );
          })}
        </Grid2>
      </Box>
    </Box>
  );
});
