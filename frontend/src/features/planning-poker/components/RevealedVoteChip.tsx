import { Chip } from '@mui/material';
import type { Vote } from '../store/planningPokerStore';

function getFibonacciCeil(value: number): number {
  if (value <= 1) return 1;

  let a = 1;
  let b = 1;

  while (b < value) {
    [a, b] = [b, a + b];
  }

  return b;
}

function getRevealedVoteLabel(votes: Vote[]): string {
  const numericVotes = votes.map((v) => parseFloat(v.value ?? '')).filter((n) => !Number.isNaN(n));

  if (numericVotes.length === 0) return '—';

  const average = numericVotes.reduce((sum, n) => sum + n, 0) / numericVotes.length;
  const averageOneDecimal = Number(average.toFixed(1));
  const fibonacciCeil = getFibonacciCeil(average);

  if (averageOneDecimal === fibonacciCeil) {
    return fibonacciCeil.toString();
  }

  return `${averageOneDecimal.toFixed(1)} / ${fibonacciCeil}`;
}

function isConsensus(votes: Vote[]): boolean {
  const label = getRevealedVoteLabel(votes);
  return !label.includes('/');
}

export function RevealedVoteChip({ votes }: { votes: Vote[] }) {
  return (
    <Chip
      label={getRevealedVoteLabel(votes)}
      size="small"
      color={isConsensus(votes) ? 'success' : 'primary'}
      variant="outlined"
    />
  );
}
