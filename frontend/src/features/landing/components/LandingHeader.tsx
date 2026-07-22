import { Stack } from '@mui/material';
import { LanguageSelector } from '../../i18n/components/LanguageSelector';
import { ThemeToggle } from '../../theme/components/ThemeToggle';

export function LandingHeader() {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <LanguageSelector compact />
      <ThemeToggle />
    </Stack>
  );
}
