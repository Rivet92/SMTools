import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  toggleArchiveNote,
  reorderNotes,
} from '../notes';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('notes API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetchNotes returns paged response', async () => {
    const mockResponse = { items: [{ id: 'note-1', title: 'Test' }], totalCount: 1 };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchNotes();
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('fetchNotes sends archived and pagination params', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], totalCount: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await fetchNotes(true, 2, 50);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes?page=2&pageSize=50&archived=true',
      expect.any(Object),
    );
  });

  it('createNote sends POST and returns note', async () => {
    const mockNote = { id: 'note-1', title: 'New Note', content: 'Hello' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockNote), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await createNote({ title: 'New Note', content: 'Hello' });
    expect(result).toEqual(mockNote);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New Note', content: 'Hello' }),
      }),
    );
  });

  it('updateNote sends PUT and returns note', async () => {
    const mockNote = { id: 'note-1', title: 'Updated', content: 'Updated content' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockNote), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await updateNote('note-1', { title: 'Updated' });
    expect(result).toEqual(mockNote);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes/note-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }),
    );
  });

  it('deleteNote sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await deleteNote('note-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes/note-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('toggleArchiveNote sends PUT to archive endpoint', async () => {
    const mockNote = { id: 'note-1', title: 'Test', isArchived: true };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockNote), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await toggleArchiveNote('note-1');
    expect(result).toEqual(mockNote);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes/note-1/archive',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('reorderNotes sends PUT with updates', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const updates = [{ noteId: 'note-1', position: 1 }];
    await reorderNotes(updates);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes/reorder',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ updates }),
      }),
    );
  });
});
