import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/languageStore';

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const { currentLanguage, languages, setCurrentLanguage } = useLanguageStore();

  if (languages.length === 0) {
    return null;
  }

  return (
    <Box mb={compact ? 0 : 3}>
      <FormControl size="small" sx={{ minWidth: { xs: 90, sm: compact ? 140 : 180 } }}>
        <InputLabel id="language-selector-label">{t('language.selector')}</InputLabel>
        <Select
          labelId="language-selector-label"
          value={currentLanguage}
          label={t('language.selector')}
          onChange={(event) => setCurrentLanguage(event.target.value)}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              {t(language.name)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
