import { describe, it, expect, beforeEach } from 'vitest';
import { useRetroStore } from '../retroStore';
import type { RoomState } from '../retroStore';
// base selectors tested in roomSelectors.test.ts

const mockRoom: RoomState = {
  id: 'retro-1',
  title: 'Test Retro',
  createdAt: new Date().toISOString(),
  phase: 'Gathering',
  templateId: 'tpl-1',
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
  ],
  columns: [],
  cards: [
    {
      id: 'c1',
      columnId: 'col-1',
      groupId: null,
      content: 'Good point',
      authorParticipantId: 'p1',
      createdAt: new Date().toISOString(),
      voteCount: 0,
      ownVotePoints: 0,
    },
  ],
  groups: [],
  actionItems: [],
  ownParticipantId: 'p1',
  hasPassword: false,
  version: 1,
};

describe('retroStore', () => {
  beforeEach(() => {
    useRetroStore.setState({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
    });
  });

  it('optimisticVote increments counters', () => {
    useRetroStore.setState({ room: mockRoom });
    useRetroStore.getState().optimisticVote('c1');
    const card = useRetroStore.getState().room!.cards[0]!;
    expect(card.voteCount).toBe(1);
    expect(card.ownVotePoints).toBe(1);
  });

  it('optimisticRemoveVote decrements counters', () => {
    useRetroStore.setState({
      room: { ...mockRoom, cards: [{ ...mockRoom.cards[0]!, voteCount: 2, ownVotePoints: 2 }] },
    });
    useRetroStore.getState().optimisticRemoveVote('c1');
    const card = useRetroStore.getState().room!.cards[0]!;
    expect(card.voteCount).toBe(1);
    expect(card.ownVotePoints).toBe(1);
  });

  it('optimisticRemoveVote does not go below zero', () => {
    useRetroStore.setState({ room: mockRoom });
    useRetroStore.getState().optimisticRemoveVote('c1');
    const card = useRetroStore.getState().room!.cards[0]!;
    expect(card.voteCount).toBe(0);
    expect(card.ownVotePoints).toBe(0);
  });

  it('optimisticSetPhase changes phase', () => {
    useRetroStore.setState({ room: mockRoom });
    useRetroStore.getState().optimisticSetPhase('Grouping');
    expect(useRetroStore.getState().room!.phase).toBe('Grouping');
  });

  it('optimisticVote does nothing when no room', () => {
    useRetroStore.getState().optimisticVote('c1');
    expect(useRetroStore.getState().room).toBeNull();
  });

  it('optimisticRemoveVote does nothing when no room', () => {
    useRetroStore.getState().optimisticRemoveVote('c1');
    expect(useRetroStore.getState().room).toBeNull();
  });
});
