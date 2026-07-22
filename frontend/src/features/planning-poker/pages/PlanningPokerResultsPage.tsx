import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Stack,
  Grid2,
  CircularProgress,
  Alert,
} from '@mui/material';
import { IconArrowLeft, IconClipboardText } from '@tabler/icons-react';
import { PageHead } from '../../seo/components/PageHead';
import { PageHeader } from '../../../components/PageHeader';
import { planningPokerApi } from '../../../api/planning-poker';
import { planningPoker } from '../../../api/queryKeys';
import { useNavigationStore } from '../../layout/store/navigationStore';
import { RevealedVoteChip } from '../components/RevealedVoteChip';

export function PlanningPokerResultsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setBreadcrumbRoomTitle = useNavigationStore((s) => s.setBreadcrumbRoomTitle);

  const {
    data: room,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: planningPoker.results(roomId!),
    queryFn: () => planningPokerApi.fetchResults(roomId!),
    enabled: !!roomId,
  });

  useEffect(() => {
    setBreadcrumbRoomTitle(room?.title ?? null);
    return () => setBreadcrumbRoomTitle(null);
  }, [room?.title, setBreadcrumbRoomTitle]);

  const handleBackToRoom = useCallback(() => {
    if (!room) return;
    navigate(`/tools/planning-poker/${room.id}`);
  }, [navigate, room]);

  const handleBackToLobby = useCallback(() => {
    navigate('/tools/planning-poker');
  }, [navigate]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <>
        <PageHead
          title={t('seo.planningPoker.title')}
          description={t('seo.planningPoker.description')}
        />
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (error || !room) {
    const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
    return (
      <>
        <PageHead
          title={t('seo.planningPoker.title')}
          description={t('seo.planningPoker.description')}
        />
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, px: 2 }}>
          <Alert severity="error">
            {t('planningPoker.errors.loadResults', { message: errorMessage })}
          </Alert>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<IconArrowLeft size={16} />}
              onClick={handleRetry}
            >
              {t('common.retry')}
            </Button>
            <Button startIcon={<IconArrowLeft size={16} />} onClick={handleBackToLobby}>
              {t('planningPoker.leaveRoom')}
            </Button>
          </Stack>
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHead
        title={`${room.title} \u00b7 ${t('seo.planningPoker.title')}`}
        description={t('seo.planningPoker.description')}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          title={room.title}
          onBack={handleBackToRoom}
          backAriaLabel={t('planningPoker.aria.resultsBack')}
          variant="h6"
        />

        <Box sx={{ pt: 2 }}>
          {room.voteItems.length === 0 ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <IconClipboardText size={48} stroke={1} />
                <Typography variant="h6" color="text.secondary">
                  {t('planningPoker.noItems')}
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {room.voteItems.map((vi) => (
                <Paper key={vi.id} variant="outlined" sx={{ p: 2 }}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="h6">{vi.title}</Typography>
                    {vi.isRevealed && vi.votes.length > 0 ? (
                      <Box
                        sx={{
                          '& .MuiChip-root': {
                            fontWeight: 700,
                            fontSize: '1rem',
                            '& .MuiChip-label': { px: 1 },
                          },
                        }}
                      >
                        <RevealedVoteChip votes={vi.votes} />
                      </Box>
                    ) : (
                      <Chip
                        label={t('planningPoker.notRevealed')}
                        variant="outlined"
                        color="warning"
                        sx={{ fontWeight: 700, fontSize: '1rem', '& .MuiChip-label': { px: 1 } }}
                      />
                    )}
                  </Box>

                  {vi.isRevealed && vi.votes.length > 0 && (
                    <Grid2 container spacing={1} sx={{ mt: 2 }}>
                      {vi.votes.map((vr) => (
                        <Grid2 key={vr.participantId}>
                          <Paper
                            variant="outlined"
                            sx={{ px: 2, py: 1, textAlign: 'center', bgcolor: 'action.hover' }}
                          >
                            <Typography variant="h6">{vr.value}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vr.participantName}
                            </Typography>
                          </Paper>
                        </Grid2>
                      ))}
                    </Grid2>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
}
