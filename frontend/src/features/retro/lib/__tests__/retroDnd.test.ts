import { describe, it, expect, vi } from 'vitest';
import { cardDropId, groupDropId, ungroupedDropId, parseDragId, handleCardDrop } from '../retroDnd';
import type { RetroCard } from '../../../../types/models/retro';

describe('retroDnd identifiers', () => {
  it('cardDropId creates correct prefix', () => {
    expect(cardDropId('card-1')).toBe('retro-card-card-1');
  });

  it('groupDropId creates correct prefix', () => {
    expect(groupDropId('group-1')).toBe('retro-group-group-1');
  });

  it('ungroupedDropId creates correct prefix', () => {
    expect(ungroupedDropId('col-1')).toBe('ungrouped-drop-col-1');
  });
});

describe('parseDragId', () => {
  it('parses a card id', () => {
    expect(parseDragId('retro-card-card-1')).toEqual({ type: 'card', entityId: 'card-1' });
  });

  it('parses a group id', () => {
    expect(parseDragId('retro-group-group-1')).toEqual({ type: 'group', entityId: 'group-1' });
  });

  it('parses an ungrouped drop id', () => {
    expect(parseDragId('ungrouped-drop-col-1')).toEqual({ type: 'ungrouped', entityId: 'col-1' });
  });

  it('returns null for unknown prefix', () => {
    expect(parseDragId('unknown-123')).toBeNull();
  });
});

describe('handleCardDrop', () => {
  const cards: RetroCard[] = [
    {
      id: 'c1',
      columnId: 'col-1',
      content: 'Card 1',
      authorParticipantId: 'Alice',
      groupId: null,
      ownVotePoints: 0,
      voteCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    } as RetroCard,
    {
      id: 'c2',
      columnId: 'col-1',
      content: 'Card 2',
      authorParticipantId: 'Bob',
      groupId: 'g1',
      ownVotePoints: 0,
      voteCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    } as RetroCard,
    {
      id: 'c3',
      columnId: 'col-1',
      content: 'Card 3',
      authorParticipantId: 'Charlie',
      groupId: null,
      ownVotePoints: 0,
      voteCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    } as RetroCard,
  ];

  it('does nothing when dragging onto itself', () => {
    const onMoveCardToGroup = vi.fn();
    const onCreateGroup = vi.fn();
    handleCardDrop('c1', 'c1', cards, onMoveCardToGroup, onCreateGroup);
    expect(onMoveCardToGroup).not.toHaveBeenCalled();
    expect(onCreateGroup).not.toHaveBeenCalled();
  });

  it('returns early if dragged card is not found', () => {
    const onMoveCardToGroup = vi.fn();
    const onCreateGroup = vi.fn();
    handleCardDrop('nonexistent', 'c1', cards, onMoveCardToGroup, onCreateGroup);
    expect(onMoveCardToGroup).not.toHaveBeenCalled();
    expect(onCreateGroup).not.toHaveBeenCalled();
  });

  it('returns early if target card is not found', () => {
    const onMoveCardToGroup = vi.fn();
    const onCreateGroup = vi.fn();
    handleCardDrop('c1', 'nonexistent', cards, onMoveCardToGroup, onCreateGroup);
    expect(onMoveCardToGroup).not.toHaveBeenCalled();
    expect(onCreateGroup).not.toHaveBeenCalled();
  });

  it("moves dragged card to target's group when target has a group", () => {
    const onMoveCardToGroup = vi.fn();
    const onCreateGroup = vi.fn();
    handleCardDrop('c1', 'c2', cards, onMoveCardToGroup, onCreateGroup);
    expect(onMoveCardToGroup).toHaveBeenCalledWith('c1', 'g1');
    expect(onCreateGroup).not.toHaveBeenCalled();
  });

  it("moves target card to dragged card's group when dragged has a group", () => {
    const onMoveCardToGroup = vi.fn();
    const onCreateGroup = vi.fn();
    handleCardDrop('c2', 'c1', cards, onMoveCardToGroup, onCreateGroup);
    expect(onMoveCardToGroup).toHaveBeenCalledWith('c1', 'g1');
    expect(onCreateGroup).not.toHaveBeenCalled();
  });

  it('creates a group when neither card has a group', () => {
    const onMoveCardToGroup = vi.fn();
    const onCreateGroup = vi.fn();
    handleCardDrop('c1', 'c3', cards, onMoveCardToGroup, onCreateGroup);
    expect(onMoveCardToGroup).not.toHaveBeenCalled();
    expect(onCreateGroup).toHaveBeenCalledWith('c3', 'c1', expect.any(String));
  });
});
