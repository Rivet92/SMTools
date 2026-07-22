import { describe, it, expect, beforeEach } from 'vitest';
import { usePlanningPokerStore } from '../planningPokerStore';
import type { RoomState } from '../planningPokerStore';
import { selectConnectedCount } from '../../../../stores/roomSelectors';

const mockRoom: RoomState = {
  id: 'room-1',
  title: 'Test Room',
  createdAt: new Date().toISOString(),
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
    { id: 'p2', displayName: 'Bob', isOwner: false, isAdmin: false, isConnected: true },
  ],
  voteItems: [{ id: 'vi-1', title: 'Item 1', isRevealed: false, votes: [] }],
  ownParticipantId: 'p1',
  deckId: '00000000-0000-0000-0000-000000000001',
  hasPassword: false,
  version: 1,
};

const mockRoomExtended: RoomState = {
  id: 'room-1',
  title: 'Test Room',
  createdAt: new Date().toISOString(),
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
    { id: 'p2', displayName: 'Bob', isOwner: false, isAdmin: false, isConnected: false },
    { id: 'p3', displayName: 'Charlie', isOwner: false, isAdmin: false, isConnected: true },
  ],
  voteItems: [{ id: 'vi-1', title: 'Item 1', isRevealed: false, votes: [] }],
  ownParticipantId: 'p1',
  deckId: '00000000-0000-0000-0000-000000000001',
  hasPassword: false,
  version: 1,
};

describe('planningPokerStore', () => {
  beforeEach(() => {
    usePlanningPokerStore.setState({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      selectedVoteItemId: null,
      lastVersion: 0,
      lastPassword: null,
    });
  });

  it('setError updates error', () => {
    usePlanningPokerStore.getState().setError('Something went wrong');
    expect(usePlanningPokerStore.getState().error).toBe('Something went wrong');
  });

  it('optimisticVote adds vote for own participant', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    usePlanningPokerStore.getState().optimisticVote('vi-1', '5');
    const voteItem = usePlanningPokerStore.getState().room!.voteItems[0]!;
    expect(voteItem.votes).toHaveLength(1);
    expect(voteItem.votes[0]!.participantId).toBe('p1');
    expect(voteItem.votes[0]!.value).toBe('5');
  });

  it('optimisticVote replaces existing vote', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    usePlanningPokerStore.getState().optimisticVote('vi-1', '5');
    usePlanningPokerStore.getState().optimisticVote('vi-1', '8');
    const voteItem = usePlanningPokerStore.getState().room!.voteItems[0]!;
    expect(voteItem.votes).toHaveLength(1);
    expect(voteItem.votes[0]!.value).toBe('8');
  });

  it('optimisticRevealVotes marks item as revealed', () => {
    usePlanningPokerStore.setState({ room: mockRoom });
    usePlanningPokerStore.getState().optimisticRevealVotes('vi-1');
    expect(usePlanningPokerStore.getState().room!.voteItems[0]!.isRevealed).toBe(true);
  });

  it('optimisticResetVotes clears votes and reveal', () => {
    usePlanningPokerStore.setState({
      room: {
        ...mockRoom,
        voteItems: [
          {
            id: 'vi-1',
            title: 'Item 1',
            isRevealed: true,
            votes: [{ participantId: 'p1', participantName: 'Alice', value: '5' }],
          },
        ],
      },
    });
    usePlanningPokerStore.getState().optimisticResetVotes('vi-1');
    const voteItem = usePlanningPokerStore.getState().room!.voteItems[0]!;
    expect(voteItem.isRevealed).toBe(false);
    expect(voteItem.votes).toHaveLength(0);
  });

  describe('setSelectedVoteItemId', () => {
    it('sets the selected vote item id', () => {
      usePlanningPokerStore.getState().setSelectedVoteItemId('vi-1');
      expect(usePlanningPokerStore.getState().selectedVoteItemId).toBe('vi-1');
    });

    it('clears the selected vote item id', () => {
      usePlanningPokerStore.setState({ selectedVoteItemId: 'vi-1' });
      usePlanningPokerStore.getState().setSelectedVoteItemId(null);
      expect(usePlanningPokerStore.getState().selectedVoteItemId).toBeNull();
    });
  });

  describe('setRoom', () => {
    it('updates version from room', () => {
      usePlanningPokerStore.setState({ room: mockRoom });
      const newRoom = { ...mockRoom, version: 2, title: 'Updated' };
      usePlanningPokerStore.getState().setRoom(newRoom);
      expect(usePlanningPokerStore.getState().room!.version).toBe(2);
      expect(usePlanningPokerStore.getState().lastVersion).toBe(2);
    });

    it('keeps ownParticipantId from current state', () => {
      usePlanningPokerStore.setState({ room: { ...mockRoom, ownParticipantId: 'p1' } });
      const newRoom = { ...mockRoom, ownParticipantId: 'p2', version: 2 };
      usePlanningPokerStore.getState().setRoom(newRoom);
      expect(usePlanningPokerStore.getState().room!.ownParticipantId).toBe('p1');
    });

    it('ignores stale state when version is not newer', () => {
      usePlanningPokerStore.setState({ room: { ...mockRoom, version: 5 } });
      const newRoom = { ...mockRoom, version: 3, title: 'Stale' };
      usePlanningPokerStore.getState().setRoom(newRoom);
      expect(usePlanningPokerStore.getState().room!.title).toBe('Test Room');
      expect(usePlanningPokerStore.getState().room!.version).toBe(5);
    });

    it('does nothing when null', () => {
      usePlanningPokerStore.setState({ room: mockRoom });
      usePlanningPokerStore.getState().setRoom(null as unknown as RoomState);
      expect(usePlanningPokerStore.getState().room).not.toBeNull();
    });

    it('sets room when no previous room', () => {
      usePlanningPokerStore.setState({ room: null });
      const newRoom = { ...mockRoom, ownParticipantId: 'p2', version: 1 };
      usePlanningPokerStore.getState().setRoom(newRoom);
      expect(usePlanningPokerStore.getState().room?.ownParticipantId).toBe('p2');
    });
  });

  describe('applyVoteRevealed', () => {
    it('marks a vote item as revealed', () => {
      usePlanningPokerStore.setState({ room: mockRoom });
      usePlanningPokerStore.getState().applyVoteRevealed({ voteItemId: 'vi-1', version: 0 });
      expect(usePlanningPokerStore.getState().room!.voteItems[0]!.isRevealed).toBe(true);
    });

    it('does nothing when no room', () => {
      const state = usePlanningPokerStore.getState();
      state.applyVoteRevealed({ voteItemId: 'vi-1', version: 0 });
      expect(usePlanningPokerStore.getState().room).toBeNull();
    });
  });

  describe('applyVoteItemAdded', () => {
    it('adds a new vote item', () => {
      usePlanningPokerStore.setState({ room: mockRoom });
      usePlanningPokerStore
        .getState()
        .applyVoteItemAdded({ voteItemId: 'vi-2', title: 'Item 2', version: 0 });
      expect(usePlanningPokerStore.getState().room!.voteItems).toHaveLength(2);
      expect(usePlanningPokerStore.getState().room!.voteItems[1]!.title).toBe('Item 2');
    });

    it('does nothing when no room', () => {
      usePlanningPokerStore.getState().applyVoteItemAdded({
        voteItemId: 'vi-2',
        title: 'Item 2',
        version: 0,
      });
      expect(usePlanningPokerStore.getState().room).toBeNull();
    });
  });

  describe('applyVoteItemDeleted', () => {
    it('removes a vote item', () => {
      usePlanningPokerStore.setState({ room: mockRoom });
      usePlanningPokerStore.getState().applyVoteItemDeleted({ voteItemId: 'vi-1', version: 0 });
      expect(usePlanningPokerStore.getState().room!.voteItems).toHaveLength(0);
    });

    it('does nothing when no room', () => {
      usePlanningPokerStore.getState().applyVoteItemDeleted({ voteItemId: 'vi-1', version: 0 });
      expect(usePlanningPokerStore.getState().room).toBeNull();
    });
  });

  describe('applyVotesReset', () => {
    it('resets votes on a vote item', () => {
      usePlanningPokerStore.setState({
        room: {
          ...mockRoom,
          voteItems: [
            {
              id: 'vi-1',
              title: 'Item 1',
              isRevealed: true,
              votes: [{ participantId: 'p1', participantName: 'Alice', value: '5' }],
            },
          ],
        },
      });
      usePlanningPokerStore.getState().applyVotesReset({ voteItemId: 'vi-1', version: 0 });
      const voteItem = usePlanningPokerStore.getState().room!.voteItems[0]!;
      expect(voteItem.isRevealed).toBe(false);
      expect(voteItem.votes).toHaveLength(0);
    });

    it('does nothing when no room', () => {
      usePlanningPokerStore.getState().applyVotesReset({ voteItemId: 'vi-1', version: 0 });
      expect(usePlanningPokerStore.getState().room).toBeNull();
    });
  });

  describe('selectConnectedCount', () => {
    it('returns 0 when no room', () => {
      expect(selectConnectedCount(usePlanningPokerStore.getState().room)).toBe(0);
    });

    it('counts connected participants', () => {
      usePlanningPokerStore.setState({ room: mockRoomExtended });
      expect(selectConnectedCount(usePlanningPokerStore.getState().room)).toBe(2);
    });
  });
});
