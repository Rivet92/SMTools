import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPlanningPokerDecks, planningPokerApi } from '../planning-poker';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('planning-poker API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetchPlanningPokerDecks returns decks', async () => {
    const mockDecks = [
      { id: '00000000-0000-0000-0000-000000000001', key: 'fibonacci', isDefault: true, cards: [] },
    ];

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockDecks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchPlanningPokerDecks();
    expect(result).toEqual(mockDecks);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/planningpoker/decks',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('planningPokerApi.create sends request and returns room', async () => {
    const mockRoom = { id: 'room-1', title: 'Test' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockRoom), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await planningPokerApi.create({
      title: 'Test',
      deckId: '00000000-0000-0000-0000-000000000001',
    });
    expect(result).toEqual(mockRoom);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/planningpoker/rooms',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test', deckId: '00000000-0000-0000-0000-000000000001' }),
      }),
    );
  });

  it('planningPokerApi.fetchResults returns room state', async () => {
    const mockState = { id: 'room-1', voteItems: [] };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockState), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await planningPokerApi.fetchResults('room-1');
    expect(result).toEqual(mockState);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/planningpoker/rooms/room-1/results',
      expect.any(Object),
    );
  });

  it('planningPokerApi.fetchMyRooms returns paged response', async () => {
    const mockResponse = { items: [], totalCount: 0 };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await planningPokerApi.fetchMyRooms(1, 10);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/planningpoker/rooms/my?page=1&pageSize=10',
      expect.any(Object),
    );
  });

  it('planningPokerApi.removeSelf sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await planningPokerApi.removeSelf('room-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/planningpoker/rooms/room-1/participants/me',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('planningPokerApi.delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await planningPokerApi.delete('room-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/planningpoker/rooms/room-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
