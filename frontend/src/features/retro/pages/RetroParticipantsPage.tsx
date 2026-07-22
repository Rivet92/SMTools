import { useParams } from 'react-router-dom';
import { ParticipantsPage } from '../../../components/room-participants/ParticipantsPage';
import { useRetroStore } from '../store/retroStore';
import * as hub from '../retroHub';

export function RetroParticipantsPage() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <ParticipantsPage
      useStore={useRetroStore}
      hub={hub}
      navigateBack={`/tools/retro/${roomId}`}
      errorKeyPrefix="retro.errors"
      featureKey="retro"
    />
  );
}
