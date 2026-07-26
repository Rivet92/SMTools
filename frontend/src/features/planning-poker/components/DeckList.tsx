import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { usePlanningPokerDecks } from '../hooks/usePlanningPoker';
import { DeckCard } from './DeckCard';

export function DeckList() {
  const { t } = useTranslation();
  const { data: decks, isLoading, isError, error } = usePlanningPokerDecks();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error?.message || t('decks.error')}
      </Alert>
    );
  }

  if (!decks || decks.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" textAlign="center" p={4}>
        {t('decks.empty')}
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {decks.map((deck) => (
        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={deck.id}>
          <DeckCard deck={deck} />
        </Grid>
      ))}
    </Grid>
  );
}
