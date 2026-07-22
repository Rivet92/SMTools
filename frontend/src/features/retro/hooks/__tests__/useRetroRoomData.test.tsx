import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRetroRoomData } from '../useRetroRoomData';
import { useRetroStore } from '../../store/retroStore';
import type { RoomState } from '../../store/retroStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../useRetroTemplates', () => ({
  useRetroTemplates: () => ({
    data: [
      { id: 'tpl-1', key: 'start-stop-continue', name: 'Start Stop Continue', isDefault: true, columns: [] },
    ],
    isLoading: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockRoom: RoomState = {
  id: 'retro-1',
  title: 'Test Retro',
  createdAt: new Date().toISOString(),
  phase: 'Gathering' as const,
  templateId: 'tpl-1',
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: false, isConnected: true },
    { id: 'p2', displayName: 'Bob', isOwner: false, isAdmin: true, isConnected: true },
    { id: 'p3', displayName: 'Charlie', isOwner: false, isAdmin: false, isConnected: false },
  ],
  columns: [
    { id: 'col-1', key: 'good', displayOrder: 1, color: '#4caf50', icon: 'thumb_up' },
  ],
  cards: [
    {
      id: 'c1',
      columnId: 'col-1',
      groupId: null,
      content: 'Good point',
      authorParticipantId: 'p1',
      createdAt: new Date().toISOString(),
      voteCount: 2,
      ownVotePoints: 1,
    },
  ],
  groups: [],
  actionItems: [
    { id: 'ai-1', content: 'Do more', assigneeParticipantId: null, createdAt: new Date().toISOString() },
  ],
  ownParticipantId: 'p1',
  hasPassword: false,
  version: 1,
};

describe('useRetroRoomData', () => {
  beforeEach(() => {
    useRetroStore.setState({
      connectionState: 'connected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
      lastVersion: 0,
    });
  });

  it('returns room from store', () => {
    useRetroStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.room?.title).toBe('Test Retro');
  });

  it('returns connection state', () => {
    useRetroStore.setState({ connectionState: 'connecting' });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.room).toBeNull();
  });

  it('returns hasPassword from room', () => {
    useRetroStore.setState({ room: { ...mockRoom, hasPassword: true } });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.hasPassword).toBe(true);
  });

  it('returns hasPassword as false when no room', () => {
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.hasPassword).toBe(false);
  });

  it('returns isOwner from selectors', () => {
    useRetroStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.isOwner).toBe(true);
  });

  it('returns isAdmin from selectors', () => {
    useRetroStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns connectedCount', () => {
    useRetroStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.connectedCount).toBe(2);
  });

  it('returns canManage when isAdmin', () => {
    useRetroStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.canManage).toBe(true);
  });

  it('returns storeError', () => {
    useRetroStore.setState({ error: 'Something went wrong' });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.storeError).toBe('Something went wrong');
  });

  it('returns template matching templateId', () => {
    useRetroStore.setState({ room: mockRoom });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.template?.id).toBe('tpl-1');
  });

  it('returns null template when room has no templateId', () => {
    useRetroStore.setState({ room: { ...mockRoom, templateId: 'non-existent' } });
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.template).toBeUndefined();
  });

  it('works when room is null', () => {
    const { result } = renderHook(() => useRetroRoomData(), { wrapper: createWrapper() });
    expect(result.current.room).toBeNull();
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.connectedCount).toBe(0);
    expect(result.current.hasPassword).toBe(false);
    expect(result.current.template).toBeUndefined();
  });
});
