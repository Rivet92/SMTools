import { useState } from 'react';
import { Box, Paper, Typography, Chip, IconButton, Collapse } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IconArrowUp, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { RetroColumn, RetroCard, RetroCardGroup } from '../../../types/models/retro';
import { getRetroColumnNameKey } from '../../../types/models/retro';

export function CardsSummaryTable({
  templateKey,
  columns,
  cards,
  groups,
}: {
  templateKey: string;
  columns: RetroColumn[];
  cards: RetroCard[];
  groups: RetroCardGroup[];
}) {
  const { t } = useTranslation();

  if (cards.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          height: '100%',
          p: 4,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('retro.noCards')}
        </Typography>
      </Paper>
    );
  }

  const groupById = new Map(groups.map((g) => [g.id, g]));

  const firstCardIdInGroup = new Set<string>();
  for (const group of groups) {
    const groupCards = cards.filter((c) => c.groupId === group.id);
    if (groupCards.length === 0) continue;
    groupCards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstCard = groupCards[0];
    if (firstCard) firstCardIdInGroup.add(firstCard.id);
  }

  return (
    <Paper variant="outlined" sx={{ height: '100%', overflow: 'auto' }}>
      {columns
        .filter((col) => cards.some((c) => c.columnId === col.id))
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((column) => {
          const columnCards = cards
            .filter((c) => c.columnId === column.id)
            .sort((a, b) => b.voteCount - a.voteCount);

          if (columnCards.length === 0) return null;

          return (
            <Box key={column.id}>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: 3,
                  borderColor: column.color,
                  bgcolor: 'action.selected',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: column.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t(getRetroColumnNameKey(templateKey, column.key))}
                </Typography>
              </Box>

              {columnCards.map((card) => {
                const group = card.groupId ? groupById.get(card.groupId) : undefined;
                const isFirstInGroup = firstCardIdInGroup.has(card.id);
                const isSecondaryInGroup = card.groupId && !isFirstInGroup;

                if (isSecondaryInGroup) return null;

                const siblingCards = group
                  ? cards
                      .filter((c) => c.groupId === group.id && c.id !== card.id)
                      .sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                      )
                  : [];

                return <GroupCardRow key={card.id} card={card} siblingCards={siblingCards} />;
              })}
            </Box>
          );
        })}
    </Paper>
  );
}

function GroupCardRow({ card, siblingCards }: { card: RetroCard; siblingCards: RetroCard[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasSiblings = siblingCards.length > 0;

  return (
    <Box>
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
          ...(hasSiblings ? { bgcolor: 'action.hover' } : {}),
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            {hasSiblings && (
              <IconButton
                size="small"
                onClick={() => setExpanded((p) => !p)}
                sx={{ p: 0, mt: 0.25, flexShrink: 0 }}
              >
                {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </IconButton>
            )}
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {card.content}
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<IconArrowUp size={14} />}
          label={card.voteCount}
          size="small"
          color={card.voteCount > 0 ? 'primary' : 'default'}
          variant={card.voteCount > 0 ? 'filled' : 'outlined'}
          sx={{ minWidth: 56, flexShrink: 0, fontWeight: 600 }}
        />
      </Box>

      {hasSiblings && (
        <Collapse in={expanded}>
          {siblingCards.map((sibling) => {
            return (
              <Box
                key={sibling.id}
                sx={{
                  px: 2,
                  py: 1,
                  pl: 5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  borderLeft: 3,
                  borderLeftColor: 'primary.light',
                  bgcolor: 'action.hover',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {sibling.content}
                  </Typography>
                </Box>

                <Chip
                  icon={<IconArrowUp size={14} />}
                  label={sibling.voteCount}
                  size="small"
                  color={sibling.voteCount > 0 ? 'primary' : 'default'}
                  variant={sibling.voteCount > 0 ? 'filled' : 'outlined'}
                  sx={{ minWidth: 56, flexShrink: 0, fontWeight: 600 }}
                />
              </Box>
            );
          })}
        </Collapse>
      )}
    </Box>
  );
}
