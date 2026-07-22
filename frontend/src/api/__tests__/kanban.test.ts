import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kanbanApi } from '../kanban';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('kanban API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('kanbanApi.create sends request and returns room', async () => {
    const mockRoom = { id: 'room-1', title: 'Test Kanban' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockRoom), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await kanbanApi.create({ title: 'Test Kanban' });
    expect(result).toEqual(mockRoom);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/kanban/rooms',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test Kanban' }),
      }),
    );
  });

  it('kanbanApi.fetchMyRooms returns paged response', async () => {
    const mockResponse = { items: [], totalCount: 0 };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await kanbanApi.fetchMyRooms(1, 20);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/kanban/rooms/my?page=1&pageSize=20',
      expect.any(Object),
    );
  });

  it('kanbanApi.removeSelf sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await kanbanApi.removeSelf('room-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/kanban/rooms/room-1/participants/me',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('kanbanApi.delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await kanbanApi.delete('room-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/kanban/rooms/room-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('kanbanApi.fetchResults returns room state', async () => {
    const mockState = { id: 'room-1', cards: [] };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockState), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await kanbanApi.fetchResults('room-1');
    expect(result).toEqual(mockState);
    expect(mockFetch).toHaveBeenCalledWith('/api/kanban/rooms/room-1/results', expect.any(Object));
  });
});
