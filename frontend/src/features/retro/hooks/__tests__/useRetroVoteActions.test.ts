import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRetroVoteActions } from '../useRetroVoteActions';
import { useRetroStore } from '../../store/retroStore';
import type { RoomState } from '../../store/retroStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const mockHub = vi.hoisted(() => ({
  addVotePoint: vi.fn(),
  removeVotePoint: vi.fn(),
}));

vi.mock('../../retroHub', () => mockHub);

describe('useRetroVoteActions', () => {
  beforeEach(() => {
    useRetroStore.setState({
      room: null,
      connectionState: 'connected',
      error: null,
      roomClosedMessage: null,
      lastPassword: null,
      lastVersion: 0,
    });
    vi.clearAllMocks();
  });

  it('returns remaining vote points based on room cards', () => {
    useRetroStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        phase: 'Gathering',
        templateId: 'tpl-1',
        cards: [
          { id: 'c1', columnId: 'col-1', groupId: null, content: 'test', authorParticipantId: 'p1', createdAt: '', voteCount: 2, ownVotePoints: 2 },
          { id: 'c2', columnId: 'col-1', groupId: null, content: 'test', authorParticipantId: 'p1', createdAt: '', voteCount: 1, ownVotePoints: 1 },
        ],
        columns: [],
        actionItems: [],
        participants: [],
        groups: [],
        hasPassword: false,
        createdAt: '',
        version: 1,
      } as RoomState,
    });

    const { result } = renderHook(() => useRetroVoteActions(vi.fn()));
    expect(result.current.remainingVotePoints).toBe(2);
    expect(result.current.totalVotePoints).toBe(5);
  });

  it('calls addVotePoint on hub when handleAddVotePoint is called', async () => {
    mockHub.addVotePoint.mockResolvedValue(undefined);

    useRetroStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        phase: 'Gathering',
        templateId: 'tpl-1',
        cards: [{ id: 'c1', columnId: 'col-1', groupId: null, content: 'test', authorParticipantId: 'p1', createdAt: '', voteCount: 0, ownVotePoints: 0 }],
        columns: [],
        actionItems: [],
        participants: [],
        groups: [],
        hasPassword: false,
        createdAt: '',
        version: 1,
      } as RoomState,
    });

    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroVoteActions(setActionError));

    await act(async () => {
      await result.current.handleAddVotePoint('c1');
    });

    expect(mockHub.addVotePoint).toHaveBeenCalledWith('c1');
  });

  it('does not add vote point when remaining is 0', async () => {
    useRetroStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        phase: 'Gathering',
        templateId: 'tpl-1',
        cards: [{ id: 'c1', columnId: 'col-1', groupId: null, content: 'test', authorParticipantId: 'p1', createdAt: '', voteCount: 5, ownVotePoints: 5 }],
        columns: [],
        actionItems: [],
        participants: [],
        groups: [],
        hasPassword: false,
        createdAt: '',
        version: 1,
      } as RoomState,
    });

    const { result } = renderHook(() => useRetroVoteActions(vi.fn()));

    await act(async () => {
      await result.current.handleAddVotePoint('c1');
    });

    expect(mockHub.addVotePoint).not.toHaveBeenCalled();
  });

  it('calls removeVotePoint on hub when handleRemoveVotePoint is called', async () => {
    mockHub.removeVotePoint.mockResolvedValue(undefined);

    useRetroStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        phase: 'Gathering',
        templateId: 'tpl-1',
        cards: [{ id: 'c1', columnId: 'col-1', groupId: null, content: 'test', authorParticipantId: 'p1', createdAt: '', voteCount: 2, ownVotePoints: 2 }],
        columns: [],
        actionItems: [],
        participants: [],
        groups: [],
        hasPassword: false,
        createdAt: '',
        version: 1,
      } as RoomState,
    });

    const { result } = renderHook(() => useRetroVoteActions(vi.fn()));

    await act(async () => {
      await result.current.handleRemoveVotePoint('c1');
    });

    expect(mockHub.removeVotePoint).toHaveBeenCalledWith('c1');
  });

  it('does not remove vote point when card has 0 points', async () => {
    useRetroStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        phase: 'Gathering',
        templateId: 'tpl-1',
        cards: [{ id: 'c1', columnId: 'col-1', groupId: null, content: 'test', authorParticipantId: 'p1', createdAt: '', voteCount: 0, ownVotePoints: 0 }],
        columns: [],
        actionItems: [],
        participants: [],
        groups: [],
        hasPassword: false,
        createdAt: '',
        version: 1,
      } as RoomState,
    });

    const { result } = renderHook(() => useRetroVoteActions(vi.fn()));

    await act(async () => {
      await result.current.handleRemoveVotePoint('c1');
    });

    expect(mockHub.removeVotePoint).not.toHaveBeenCalled();
  });

  it('sets error when addVotePoint fails', async () => {
    mockHub.addVotePoint.mockRejectedValue(new Error('network error'));

    useRetroStore.setState({
      room: {
        id: 'room-1',
        title: 'Test',
        ownParticipantId: 'p1',
        phase: 'Gathering',
        templateId: 'tpl-1',
        cards: [{ id: 'c1', columnId: 'col-1', groupId: null, content: 'test', authorParticipantId: 'p1', createdAt: '', voteCount: 0, ownVotePoints: 0 }],
        columns: [],
        actionItems: [],
        participants: [],
        groups: [],
        hasPassword: false,
        createdAt: '',
        version: 1,
      } as RoomState,
    });

    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroVoteActions(setActionError));

    await act(async () => {
      await result.current.handleAddVotePoint('c1');
    });

    expect(setActionError).toHaveBeenCalled();
  });
});
