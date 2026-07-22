import { describe, it, expect } from 'vitest';
import { selectIsOwner, selectIsAdmin, selectConnectedCount } from '../roomSelectors';
import type { RoomStateWithParticipants } from '../roomSelectors';

const baseRoom: RoomStateWithParticipants = {
  ownParticipantId: 'user1',
  participants: [
    { id: 'user1', isOwner: true, isAdmin: false, isConnected: true },
    { id: 'user2', isOwner: false, isAdmin: true, isConnected: true },
    { id: 'user3', isOwner: false, isAdmin: false, isConnected: false },
  ],
};

describe('selectIsOwner', () => {
  it('returns true if ownParticipantId matches an owner participant', () => {
    expect(selectIsOwner(baseRoom)).toBe(true);
  });

  it('returns false if ownParticipantId is not an owner', () => {
    const room: RoomStateWithParticipants = {
      ...baseRoom,
      ownParticipantId: 'user2',
    };
    expect(selectIsOwner(room)).toBe(false);
  });

  it('returns false if ownParticipantId matches no participant', () => {
    const room: RoomStateWithParticipants = {
      ...baseRoom,
      ownParticipantId: 'unknown',
    };
    expect(selectIsOwner(room)).toBe(false);
  });

  it('returns false for null room', () => {
    expect(selectIsOwner(null)).toBe(false);
  });
});

describe('selectIsAdmin', () => {
  it('returns true if ownParticipantId is an owner', () => {
    expect(selectIsAdmin(baseRoom)).toBe(true);
  });

  it('returns true if ownParticipantId is an admin', () => {
    const room: RoomStateWithParticipants = {
      ...baseRoom,
      ownParticipantId: 'user2',
    };
    expect(selectIsAdmin(room)).toBe(true);
  });

  it('returns false if ownParticipantId is a regular member', () => {
    const room: RoomStateWithParticipants = {
      ...baseRoom,
      ownParticipantId: 'user3',
    };
    expect(selectIsAdmin(room)).toBe(false);
  });

  it('returns false if ownParticipantId matches no participant', () => {
    const room: RoomStateWithParticipants = {
      ...baseRoom,
      ownParticipantId: 'unknown',
    };
    expect(selectIsAdmin(room)).toBe(false);
  });

  it('returns false for null room', () => {
    expect(selectIsAdmin(null)).toBe(false);
  });
});

describe('selectConnectedCount', () => {
  it('counts connected participants', () => {
    expect(selectConnectedCount(baseRoom)).toBe(2);
  });

  it('returns 0 if no participants are connected', () => {
    const room: RoomStateWithParticipants = {
      ...baseRoom,
      participants: baseRoom.participants.map((p) => ({ ...p, isConnected: false })),
    };
    expect(selectConnectedCount(room)).toBe(0);
  });

  it('returns 0 for null room', () => {
    expect(selectConnectedCount(null)).toBe(0);
  });
});
