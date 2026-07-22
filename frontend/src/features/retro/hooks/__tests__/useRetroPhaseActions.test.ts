import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRetroStore } from '../../store/retroStore';
import type { RoomState } from '../../store/retroStore';

const mockHub = vi.hoisted(() => ({
  setPhase: vi.fn(),
}));

vi.mock('../../retroHub', () => mockHub);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string) => _key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const { useRetroPhaseActions } = await import('../useRetroPhaseActions');

const createRoom = (overrides: Partial<RoomState> = {}): RoomState => ({
  id: 'r1',
  title: 'Test Retro',
  ownParticipantId: 'p1',
  hasPassword: false,
  phase: 'Gathering',
  templateId: 'tpl-1',
  columns: [],
  cards: [],
  groups: [],
  actionItems: [],
  participants: [
    { id: 'p1', displayName: 'Alice', isOwner: true, isAdmin: true, isConnected: true },
  ],
  createdAt: new Date().toISOString(),
  version: 1,
  ...overrides,
});

describe('useRetroPhaseActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRetroStore.setState({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
      lastVersion: 0,
    });
  });

  it('handleNextPhase calls setPhase on hub with next index', async () => {
    mockHub.setPhase.mockResolvedValue(undefined);
    useRetroStore.setState({ room: createRoom() });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroPhaseActions(setActionError));
    await result.current.handleNextPhase();
    expect(mockHub.setPhase).toHaveBeenCalledWith(1);
  });

  it('handlePreviousPhase calls setPhase on hub with previous index', async () => {
    mockHub.setPhase.mockResolvedValue(undefined);
    useRetroStore.setState({ room: createRoom({ phase: 'Grouping' }) });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroPhaseActions(setActionError));
    await result.current.handlePreviousPhase();
    expect(mockHub.setPhase).toHaveBeenCalledWith(0);
  });

  it('handleNextPhase does nothing when at last phase', async () => {
    useRetroStore.setState({ room: createRoom({ phase: 'Actions' }) });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroPhaseActions(setActionError));
    await result.current.handleNextPhase();
    expect(mockHub.setPhase).not.toHaveBeenCalled();
  });

  it('handlePreviousPhase does nothing when at first phase', async () => {
    useRetroStore.setState({ room: createRoom() });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroPhaseActions(setActionError));
    await result.current.handlePreviousPhase();
    expect(mockHub.setPhase).not.toHaveBeenCalled();
  });

  it('sets error when hub call fails', async () => {
    mockHub.setPhase.mockRejectedValue(new Error('API Error'));
    useRetroStore.setState({ room: createRoom() });
    const setActionError = vi.fn();
    const { result } = renderHook(() => useRetroPhaseActions(setActionError));
    await result.current.handleNextPhase();
    expect(setActionError).toHaveBeenCalledWith('retro.errors.changePhase');
  });
});
