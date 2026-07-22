import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HubListeners, HubConnectionApi } from '../../../hubs/createHubConnection';

const mockConnectionApi: HubConnectionApi<{
  id: string;
  ownParticipantId: string;
  version: number;
  phase: string;
}> = {
  ensureConnected: vi.fn(),
  invoke: vi.fn(),
  disconnect: vi.fn(),
  leaveRoom: vi.fn(),
  joinRoom: vi.fn(),
  updateRoomPassword: vi.fn(),
  makeAdmin: vi.fn(),
  removeAdmin: vi.fn(),
  removeParticipant: vi.fn(),
};

let capturedListeners:
  | HubListeners<{ id: string; ownParticipantId: string; version: number; phase: string }>
  | undefined;

const mockInvalidateQueries = vi.fn();

vi.mock('../../../hubs/createHubConnection', () => ({
  createHubConnection: <TState>(
    _hubUrl: string,
    listeners: HubListeners<TState>,
  ): HubConnectionApi<TState> => {
    capturedListeners = listeners as unknown as HubListeners<{
      id: string;
      ownParticipantId: string;
      version: number;
      phase: string;
    }>;
    return mockConnectionApi as HubConnectionApi<TState>;
  },
}));

vi.mock('../../../queryClient', () => ({
  queryClient: {
    invalidateQueries: mockInvalidateQueries,
  },
}));

// Pre-load hub module to populate capturedListeners
const hubModule = await import('../retroHub');

describe('retroHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports common hub functions', () => {
    expect(hubModule.ensureConnected).toBeDefined();
    expect(hubModule.joinRoom).toBeDefined();
    expect(hubModule.leaveRoom).toBeDefined();
    expect(hubModule.disconnect).toBeDefined();
    expect(hubModule.addCard).toBeDefined();
    expect(hubModule.deleteCard).toBeDefined();
    expect(hubModule.addVotePoint).toBeDefined();
    expect(hubModule.removeVotePoint).toBeDefined();
    expect(hubModule.setPhase).toBeDefined();
    expect(hubModule.addActionItem).toBeDefined();
    expect(hubModule.deleteActionItem).toBeDefined();
    expect(hubModule.assignActionItem).toBeDefined();
    expect(hubModule.makeAdmin).toBeDefined();
    expect(hubModule.removeAdmin).toBeDefined();
    expect(hubModule.removeParticipant).toBeDefined();
  });

  it('onRoomUpdated invalidates query cache on phase change', () => {
    const prevRoom = { id: 'r1', ownParticipantId: 'p1', version: 1, phase: 'Gathering' };
    const nextRoom = { id: 'r1', ownParticipantId: 'p1', version: 2, phase: 'Grouping' };

    capturedListeners?.onRoomUpdated?.(nextRoom, prevRoom);

    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it('does not invalidate when phase has not changed', () => {
    const prevRoom = { id: 'r1', ownParticipantId: 'p1', version: 1, phase: 'Gathering' };
    const nextRoom = { id: 'r1', ownParticipantId: 'p1', version: 2, phase: 'Gathering' };

    capturedListeners?.onRoomUpdated?.(nextRoom, prevRoom);
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});
