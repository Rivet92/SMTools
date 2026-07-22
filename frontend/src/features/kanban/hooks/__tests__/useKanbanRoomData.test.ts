/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKanbanRoomData } from '../useKanbanRoomData';
import { useKanbanStore } from '../../store/kanbanStore';

describe('useKanbanRoomData', () => {
  beforeEach(() => {
    useKanbanStore.setState({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
    });
  });

  it('returns empty columns and cardsByColumn when no room', () => {
    const { result } = renderHook(() => useKanbanRoomData());

    expect(result.current.room).toBeNull();
    expect(result.current.columns).toEqual([]);
    expect(result.current.cardsByColumn.size).toBe(0);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.hasPassword).toBe(false);
  });

  it('returns sorted columns from room', () => {
    useKanbanStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        hasPassword: true,
        participants: [
          { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
        ],
        columns: [
          { id: 'c1', title: 'Column B', displayOrder: 2 },
          { id: 'c2', title: 'Column A', displayOrder: 1 },
        ],
        cards: [],
      } as any,
    });

    const { result } = renderHook(() => useKanbanRoomData());
    expect(result.current.columns).toHaveLength(2);
    expect(result.current.columns[0]!.id).toBe('c2');
    expect(result.current.columns[1]!.id).toBe('c1');
    expect(result.current.hasPassword).toBe(true);
  });

  it('groups cards by column', () => {
    useKanbanStore.setState({
      connectionState: 'connected',
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        hasPassword: false,
        participants: [
          { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
        ],
        columns: [
          { id: 'col-1', title: 'To Do', displayOrder: 1 },
          { id: 'col-2', title: 'Done', displayOrder: 2 },
        ],
        cards: [
          { id: 'card-1', columnId: 'col-1', title: 'Task 1', displayOrder: 1 },
          { id: 'card-2', columnId: 'col-2', title: 'Task 2', displayOrder: 0 },
          { id: 'card-3', columnId: 'col-1', title: 'Task 3', displayOrder: 0 },
        ],
      } as any,
    });

    const { result } = renderHook(() => useKanbanRoomData());
    expect(result.current.cardsByColumn.get('col-1')).toHaveLength(2);
    expect(result.current.cardsByColumn.get('col-2')).toHaveLength(1);
    expect(result.current.cardsByColumn.get('col-1')![0]!.id).toBe('card-3');
    expect(result.current.cardsByColumn.get('col-1')![1]!.id).toBe('card-1');
  });

  it('returns isAdmin when own participant is admin', () => {
    useKanbanStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p2',
        participants: [
          { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
          { id: 'p2', displayName: 'Bob', isOwner: false, isAdmin: true, isConnected: true },
        ],
        columns: [],
        cards: [],
      } as any,
    });

    const { result } = renderHook(() => useKanbanRoomData());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isOwner).toBe(false);
  });
});
