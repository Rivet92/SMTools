import { useParams } from 'react-router-dom';
import { ParticipantsPage } from '../../../components/room-participants/ParticipantsPage';
import { useKanbanStore } from '../store/kanbanStore';
import * as hub from '../kanbanHub';

export function KanbanParticipantsPage() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <ParticipantsPage
      useStore={useKanbanStore}
      hub={hub}
      navigateBack={`/tools/kanban/${roomId}`}
      errorKeyPrefix="kanban.errors"
      featureKey="kanban"
    />
  );
}
