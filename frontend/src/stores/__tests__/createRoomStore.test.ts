import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createBaseRoomSlice } from '../createRoomStore';

interface TestRoom {
  id: string;
  ownParticipantId: string;
  title: string;
  version: number;
}

interface TestStore {
  connectionState: 'disconnected' | 'connecting' | 'connected';
  error: string | null;
  roomClosedMessage: string | null;
  room: TestRoom | null;
  lastPassword: string | null;
  lastVersion: number;
  setConnectionState: (state: 'disconnected' | 'connecting' | 'connected') => void;
  setError: (error: string | null) => void;
  setRoomClosedMessage: (message: string | null) => void;
  closeRoom: (message: string) => void;
  setRoom: (room: TestRoom) => void;
  clearRoom: () => void;
  setLastPassword: (password: string | null) => void;
}

function createTestStore() {
  return create<TestStore>()((set) => ({
    ...createBaseRoomSlice<TestRoom>()(set),
  }));
}

describe('createRoomStore (base slice)', () => {
  it('starts with disconnected state and null room', () => {
    const store = createTestStore();
    const state = store.getState();
    expect(state.connectionState).toBe('disconnected');
    expect(state.room).toBeNull();
    expect(state.error).toBeNull();
    expect(state.roomClosedMessage).toBeNull();
    expect(state.lastPassword).toBeNull();
    expect(state.lastVersion).toBe(0);
  });

  it('setConnectionState updates connection state', () => {
    const store = createTestStore();
    store.getState().setConnectionState('connected');
    expect(store.getState().connectionState).toBe('connected');
  });

  it('setError updates error', () => {
    const store = createTestStore();
    store.getState().setError('Something went wrong');
    expect(store.getState().error).toBe('Something went wrong');
    store.getState().setError(null);
    expect(store.getState().error).toBeNull();
  });

  it('setRoomClosedMessage updates room closed message', () => {
    const store = createTestStore();
    store.getState().setRoomClosedMessage('Room was closed');
    expect(store.getState().roomClosedMessage).toBe('Room was closed');
  });

  it('closeRoom clears room and sets closedMessage', () => {
    const store = createTestStore();
    store.setState({ room: { id: 'r1', ownParticipantId: 'p1', title: 'Test', version: 1 } });
    store.getState().closeRoom('Closed');
    const state = store.getState();
    expect(state.room).toBeNull();
    expect(state.roomClosedMessage).toBe('Closed');
    expect(state.connectionState).toBe('disconnected');
    expect(state.lastVersion).toBe(0);
  });

  it('setRoom stores room and preserves ownParticipantId', () => {
    const store = createTestStore();
    store.getState().setRoom({ id: 'r1', ownParticipantId: 'p1', title: 'Test', version: 1 });
    expect(store.getState().room?.title).toBe('Test');
    expect(store.getState().room?.ownParticipantId).toBe('p1');

    store.getState().setRoom({ id: 'r1', ownParticipantId: 'p2', title: 'Updated', version: 1 });
    expect(store.getState().room!.ownParticipantId).toBe('p1');
  });

  it('clearRoom resets all fields', () => {
    const store = createTestStore();
    store.setState({
      room: { id: 'r1', ownParticipantId: 'p1', title: 'Test', version: 1 },
      roomClosedMessage: 'Closed',
      lastPassword: 'secret',
      lastVersion: 1,
    });
    store.getState().clearRoom();
    const state = store.getState();
    expect(state.room).toBeNull();
    expect(state.roomClosedMessage).toBeNull();
    expect(state.lastPassword).toBeNull();
    expect(state.lastVersion).toBe(0);
  });

  it('setLastPassword stores the password', () => {
    const store = createTestStore();
    store.getState().setLastPassword('my-password');
    expect(store.getState().lastPassword).toBe('my-password');
  });
});
