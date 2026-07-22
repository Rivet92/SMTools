import { Box, Alert, Collapse } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { VoteItemsSidebar } from './VoteItemsSidebar';
import { VoteArea } from './VoteArea';
import { ParticipantsSidebar } from './ParticipantsSidebar';
import type { VoteItemState } from '../store/planningPokerStore';
import type { RoomParticipant } from '../../../types/models/participant';
import type { PlanningPokerCard } from '../../../types/models/planning-poker';
import type { ConnectionState } from '../../../stores/createRoomStore';

interface RoomContentProps {
  room: {
    voteItems: VoteItemState[];
    participants: RoomParticipant[];
  };
  connectionState: ConnectionState;
  selectedVoteItemId: string | null;
  showVoteItems: boolean;
  showParticipants: boolean;
  storeError: string | null;
  onClearStoreError: () => void;
  onSelectItem: (id: string) => void;
  onAddItem: () => void;
  onFocusItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  isOwner: boolean;
  isAdmin: boolean;
  selectedVoteItem: VoteItemState | null;
  cards: PlanningPokerCard[];
  onVote: (value: string) => Promise<void>;
  onReveal: () => Promise<void>;
  onHide: () => Promise<void>;
  onReset: () => Promise<void>;
  isVoting: boolean;
  isRevealing: boolean;
  isHiding: boolean;
  isResetting: boolean;
  pendingFocusItemId: string | null;
  pendingDeleteItemId: string | null;
  ownParticipantId: string;
}

export function RoomContent({
  room,
  connectionState,
  selectedVoteItemId,
  showVoteItems,
  showParticipants,
  storeError,
  onClearStoreError,
  onSelectItem,
  onAddItem,
  onFocusItem,
  onDeleteItem,
  isOwner,
  isAdmin,
  selectedVoteItem,
  cards,
  onVote,
  onReveal,
  onHide,
  onReset,
  isVoting,
  isRevealing,
  isHiding,
  isResetting,
  pendingFocusItemId,
  pendingDeleteItemId,
  ownParticipantId,
}: RoomContentProps) {
  const { t } = useTranslation();

  const isReconnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected';

  return (
    <>
      {storeError && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={onClearStoreError}>
          {storeError}
        </Alert>
      )}
      {isReconnecting && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {t('planningPoker.reconnecting')}
        </Alert>
      )}
      {isDisconnected && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {t('planningPoker.disconnected')}
        </Alert>
      )}

      <Box sx={{ flex: 1, display: 'flex', overflow: 'auto', minHeight: 0 }}>
        <Collapse orientation="horizontal" in={showVoteItems} sx={{ height: '100%' }}>
          <VoteItemsSidebar
            voteItems={room.voteItems}
            selectedId={selectedVoteItemId}
            onSelectItem={onSelectItem}
            isOwner={isOwner}
            isAdmin={isAdmin}
            onAddItem={onAddItem}
            onFocusItem={onFocusItem}
            onDeleteItem={onDeleteItem}
            pendingFocusItemId={pendingFocusItemId}
            pendingDeleteItemId={pendingDeleteItemId}
          />
        </Collapse>

        <VoteArea
          voteItem={selectedVoteItem}
          ownParticipantId={ownParticipantId}
          canManage={isAdmin || isOwner}
          cards={cards}
          onVote={onVote}
          onReveal={onReveal}
          onHide={onHide}
          onReset={onReset}
          isVoting={isVoting}
          isRevealing={isRevealing}
          isHiding={isHiding}
          isResetting={isResetting}
        />

        <Collapse orientation="horizontal" in={showParticipants} sx={{ height: '100%' }}>
          <ParticipantsSidebar
            participants={room.participants}
            ownParticipantId={ownParticipantId}
            selectedVoteItem={selectedVoteItem}
          />
        </Collapse>
      </Box>
    </>
  );
}
