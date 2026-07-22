import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { PlanningPokerDeck } from '../../../types/models/planning-poker';
import { getDeckDescriptionKey, getDeckNameKey } from '../../../types/models/planning-poker';

interface DeckCardProps {
  deck: PlanningPokerDeck;
}

export function DeckCard({ deck }: DeckCardProps) {
  const { t } = useTranslation();

  const name = t(getDeckNameKey(deck.key));
  const description = t(getDeckDescriptionKey(deck.key));

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} mb={1}>
          <Typography variant="h6" component="h2">
            {name}
          </Typography>
          {deck.isDefault && <Chip label={t('deck.default')} size="small" color="primary" />}
        </Stack>

        {description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {description}
          </Typography>
        )}

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {deck.cards.map((card) => (
            <Chip
              key={card.id}
              label={card.value}
              variant="outlined"
              sx={{ minWidth: 48, justifyContent: 'center' }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
