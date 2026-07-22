import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRetroTemplates, retroApi } from '../retro';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('retro API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetchRetroTemplates returns templates', async () => {
    const mockTemplates = [{ id: 'tpl-1', name: 'Glad/Sad/Mad', columns: [] }];

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockTemplates), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchRetroTemplates();
    expect(result).toEqual(mockTemplates);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/retro/templates',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('retroApi.create sends request and returns room', async () => {
    const mockRoom = { id: 'retro-1', title: 'Test Retro' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockRoom), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await retroApi.create({ title: 'Test Retro', templateId: 'tpl-1' });
    expect(result).toEqual(mockRoom);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/retro/rooms',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test Retro', templateId: 'tpl-1' }),
      }),
    );
  });

  it('retroApi.fetchResults returns room state', async () => {
    const mockState = { id: 'retro-1', cards: [] };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockState), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await retroApi.fetchResults('retro-1');
    expect(result).toEqual(mockState);
    expect(mockFetch).toHaveBeenCalledWith('/api/retro/rooms/retro-1/results', expect.any(Object));
  });

  it('retroApi.fetchMyRooms returns paged response', async () => {
    const mockResponse = { items: [], totalCount: 0 };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await retroApi.fetchMyRooms(1, 10);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/retro/rooms/my?page=1&pageSize=10',
      expect.any(Object),
    );
  });

  it('retroApi.removeSelf sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await retroApi.removeSelf('retro-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/retro/rooms/retro-1/participants/me',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('retroApi.delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await retroApi.delete('retro-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/retro/rooms/retro-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
