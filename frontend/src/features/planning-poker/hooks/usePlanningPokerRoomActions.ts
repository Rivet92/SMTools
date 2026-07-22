import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { queryClient } from '../../../queryClient';
import { planningPoker } from '../../../api/queryKeys';
import * as hub from '../planningPokerHub';
import { usePlanningPokerStore } from '../store/planningPokerStore';
import { makeRoomAction } from '../../../hooks/makeRoomAction';
import { useRoomAdminActions } from '../../../hooks/useRoomAdminActions';
import type { VoteItemState, RoomState } from '../store/planningPokerStore';

export function usePlanningPokerRoomActions(selectedVoteItem: VoteItemState | null) {
  const { t } = useTranslation();
  const setRoom = usePlanningPokerStore((s) => s.setRoom);
  const setSelectedVoteItemId = usePlanningPokerStore((s) => s.setSelectedVoteItemId);
  const optimisticVote = usePlanningPokerStore((s) => s.optimisticVote);
  const optimisticRevealVotes = usePlanningPokerStore((s) => s.optimisticRevealVotes);
  const optimisticHideVotes = usePlanningPokerStore((s) => s.optimisticHideVotes);
  const optimisticResetVotes = usePlanningPokerStore((s) => s.optimisticResetVotes);

  const [actionError, setActionError] = useState<string | null>(null);
  const [snackbarError, setSnackbarError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [pendingFocusItemId, setPendingFocusItemId] = useState<string | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setActionError(null);
    setSnackbarError(null);
  }, []);

  const adminActions = useRoomAdminActions<RoomState>({
    hub: {
      makeAdmin: hub.makeAdmin,
      removeAdmin: hub.removeAdmin,
      removeParticipant: hub.removeParticipant,
      updateRoomPassword: hub.updateRoomPassword,
    },
    setRoom,
    t,
    errorKeyPrefix: 'planningPoker.errors',
    setActionError,
    setSnackbarError,
    clearErrors,
  });

  const handleVote = useCallback(
    async (cardValue: string) => {
      if (!selectedVoteItem) return;
      await makeRoomAction(
        async () => {
          optimisticVote(selectedVoteItem.id, cardValue);
          const result = await hub.vote(selectedVoteItem.id, cardValue);
          return result.state;
        },
        {
          t,
          errorKey: 'planningPoker.errors.vote',
          setRoom,
          setError: setSnackbarError,
          onStart: () => setIsVoting(true),
          onEnd: () => setIsVoting(false),
        },
      )();
    },
    [selectedVoteItem, optimisticVote, setRoom, t],
  );

  const handleReveal = useCallback(async () => {
    if (!selectedVoteItem) return;
    await makeRoomAction(
      async () => {
        optimisticRevealVotes(selectedVoteItem.id);
        await hub.revealVotes(selectedVoteItem.id);
        const roomId = usePlanningPokerStore.getState().room?.id;
        if (roomId) {
          queryClient.invalidateQueries({ queryKey: planningPoker.results(roomId) });
        }
      },
      {
        t,
        errorKey: 'planningPoker.errors.reveal',
        setError: setSnackbarError,
        onStart: () => setIsRevealing(true),
        onEnd: () => setIsRevealing(false),
      },
    )();
  }, [selectedVoteItem, optimisticRevealVotes, t]);

  const handleHide = useCallback(async () => {
    if (!selectedVoteItem) return;
    await makeRoomAction(
      async () => {
        optimisticHideVotes(selectedVoteItem.id);
        await hub.hideVotes(selectedVoteItem.id);
      },
      {
        t,
        errorKey: 'planningPoker.errors.hide',
        setError: setSnackbarError,
        onStart: () => setIsHiding(true),
        onEnd: () => setIsHiding(false),
      },
    )();
  }, [selectedVoteItem, optimisticHideVotes, t]);

  const handleReset = useCallback(async () => {
    if (!selectedVoteItem) return;
    await makeRoomAction(
      async () => {
        optimisticResetVotes(selectedVoteItem.id);
        await hub.resetVotes(selectedVoteItem.id);
      },
      {
        t,
        errorKey: 'planningPoker.errors.reset',
        setError: setSnackbarError,
        onStart: () => setIsResetting(true),
        onEnd: () => setIsResetting(false),
      },
    )();
  }, [selectedVoteItem, optimisticResetVotes, t]);

  const handleAddVoteItemSubmit = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      await makeRoomAction(() => hub.addVoteItem(trimmed), {
        t,
        errorKey: 'planningPoker.errors.addItem',
        setRoom,
        setError: setActionError,
        rethrow: true,
      })();
      setSelectedVoteItemId(usePlanningPokerStore.getState().room?.voteItems.at(-1)?.id ?? null);
    },
    [setRoom, setSelectedVoteItemId, t],
  );

  const handleFocusVoteItem = useCallback(
    async (voteItemId: string) => {
      if (pendingFocusItemId) return;
      await makeRoomAction(() => hub.focusVoteItem(voteItemId), {
        t,
        errorKey: 'planningPoker.errors.focusItem',
        setError: setSnackbarError,
        onStart: () => setPendingFocusItemId(voteItemId),
        onEnd: () => setPendingFocusItemId(null),
      })();
    },
    [t, pendingFocusItemId],
  );

  const handleDeleteVoteItem = useCallback(
    async (voteItemId: string) => {
      if (pendingDeleteItemId) return;
      await makeRoomAction(() => hub.deleteVoteItem(voteItemId), {
        t,
        errorKey: 'planningPoker.errors.deleteItem',
        setRoom,
        setError: setSnackbarError,
        onStart: () => setPendingDeleteItemId(voteItemId),
        onEnd: () => setPendingDeleteItemId(null),
      })();
    },
    [setRoom, t, pendingDeleteItemId],
  );

  return {
    actionError,
    setActionError,
    snackbarError,
    setSnackbarError,
    clearErrors,
    isVoting,
    isRevealing,
    isHiding,
    isResetting,
    pendingFocusItemId,
    pendingDeleteItemId,
    handleVote,
    handleReveal,
    handleHide,
    handleReset,
    handleAddVoteItemSubmit,
    handleFocusVoteItem,
    handleDeleteVoteItem,
    handleUpdatePassword: adminActions.handleUpdatePassword,
  };
}
