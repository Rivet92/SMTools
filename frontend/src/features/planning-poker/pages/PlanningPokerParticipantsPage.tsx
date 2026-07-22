import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ParticipantsPage } from '../../../components/room-participants/ParticipantsPage';
import { usePlanningPokerStore } from '../store/planningPokerStore';
import * as hub from '../planningPokerHub';

export function PlanningPokerParticipantsPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const getVoteStatus = useCallback((participantId: string) => {
    const room = usePlanningPokerStore.getState().room;
    if (!room) return false;
    for (const vi of room.voteItems) {
      for (const v of vi.votes) {
        if (v.participantId === participantId) return true;
      }
    }
    return false;
  }, []);

  return (
    <ParticipantsPage
      useStore={usePlanningPokerStore}
      hub={hub}
      navigateBack={`/tools/planning-poker/${roomId}`}
      errorKeyPrefix="planningPoker.errors"
      featureKey="planningPoker"
      getVoteStatus={getVoteStatus}
    />
  );
}
