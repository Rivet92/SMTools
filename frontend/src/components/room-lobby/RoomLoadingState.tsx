import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PageHead } from '../seo/PageHead';

interface RoomLoadingStateProps {
  seoTitleKey: string;
  seoDescriptionKey: string;
  connectingKey: string;
}

export function RoomLoadingState({
  seoTitleKey,
  seoDescriptionKey,
  connectingKey,
}: RoomLoadingStateProps) {
  const { t } = useTranslation();

  return (
    <>
      <PageHead title={t(seoTitleKey)} description={t(seoDescriptionKey)} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">{t(connectingKey)}</Typography>
      </Box>
    </>
  );
}
