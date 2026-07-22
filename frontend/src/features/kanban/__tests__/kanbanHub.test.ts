import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HubListeners, HubConnectionApi } from '../../../hubs/createHubConnection';

const mockConnectionApi: HubConnectionApi<{ id: string; ownParticipantId: string; version: number }> = {
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

let capturedHubUrl: string | undefined;

vi.mock('../../../hubs/createHubConnection', () => ({
  createHubConnection: <TState>(
    hubUrl: string,
    _listeners: HubListeners<TState>,
  ): HubConnectionApi<TState> => {
    void _listeners;
    capturedHubUrl = hubUrl;
    return mockConnectionApi as HubConnectionApi<TState>;
  },
}));

// Pre-load hub module to populate capturedHubUrl
const hubModule = await import('../kanbanHub');

describe('kanbanHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates hub with correct URL', () => {
    expect(capturedHubUrl).toBe('/hubs/kanban');
  });

  it('exports common hub functions', () => {
    expect(hubModule.ensureConnected).toBeDefined();
    expect(hubModule.joinRoom).toBeDefined();
    expect(hubModule.leaveRoom).toBeDefined();
    expect(hubModule.disconnect).toBeDefined();
    expect(hubModule.addColumn).toBeDefined();
    expect(hubModule.deleteColumn).toBeDefined();
    expect(hubModule.addCard).toBeDefined();
    expect(hubModule.moveCard).toBeDefined();
    expect(hubModule.assignCard).toBeDefined();
    expect(hubModule.addComment).toBeDefined();
    expect(hubModule.deleteComment).toBeDefined();
    expect(hubModule.deleteCard).toBeDefined();
    expect(hubModule.makeAdmin).toBeDefined();
    expect(hubModule.removeAdmin).toBeDefined();
    expect(hubModule.removeParticipant).toBeDefined();
  });
});
