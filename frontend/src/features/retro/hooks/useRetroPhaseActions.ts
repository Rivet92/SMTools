import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as hub from '../retroHub';
import { useRetroStore } from '../store/retroStore';
import { getErrorMessage } from '../../../hooks/getErrorMessage';
import { PHASES } from '../../../types/models/retro';

export function useRetroPhaseActions(setActionError: (error: string | null) => void) {
  const { t } = useTranslation();
  const optimisticSetPhase = useRetroStore((s) => s.optimisticSetPhase);

  const handleNextPhase = useCallback(async () => {
    const currentRoom = useRetroStore.getState().room;
    if (!currentRoom) return;
    const currentIndex = PHASES.indexOf(currentRoom.phase);
    if (currentIndex < 0 || currentIndex >= PHASES.length - 1) return;
    const prevPhase = currentRoom.phase;
    const nextPhase = PHASES[currentIndex + 1];
    if (!nextPhase) return;
    setActionError(null);
    optimisticSetPhase(nextPhase);
    try {
      await hub.setPhase(currentIndex + 1);
    } catch (err) {
      optimisticSetPhase(prevPhase);
      setActionError(t('retro.errors.changePhase', { message: getErrorMessage(err, t) }));
    }
  }, [optimisticSetPhase, t, setActionError]);

  const handlePreviousPhase = useCallback(async () => {
    const currentRoom = useRetroStore.getState().room;
    if (!currentRoom) return;
    const currentIndex = PHASES.indexOf(currentRoom.phase);
    if (currentIndex <= 0) return;
    const prevPhase = currentRoom.phase;
    const nextPhase = PHASES[currentIndex - 1];
    if (!nextPhase) return;
    setActionError(null);
    optimisticSetPhase(nextPhase);
    try {
      await hub.setPhase(currentIndex - 1);
    } catch (err) {
      optimisticSetPhase(prevPhase);
      setActionError(t('retro.errors.changePhase', { message: getErrorMessage(err, t) }));
    }
  }, [optimisticSetPhase, t, setActionError]);

  return { handleNextPhase, handlePreviousPhase };
}
