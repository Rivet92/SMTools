import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiGet, apiPost, ApiError } from '../client';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function createResponse(
  body: string,
  status: number,
  statusText: string,
  contentType: string,
): Response {
  return new Response(body, {
    status,
    statusText,
    headers: { 'Content-Type': contentType },
  });
}

describe('api client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('apiGet sends credentials include', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiGet('/test');

    const callArgs = mockFetch.mock.calls[0]!;
    expect(callArgs[0]).toBe('/api/test');
    expect(callArgs[1]!.credentials).toBe('include');
    expect(callArgs[1]!.method).toBe('GET');
    expect(callArgs[1]!.headers.get('X-CSRF-Protection')).toBe('1');
  });

  it('apiPost sends JSON body', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiPost('/test', { name: 'test' });

    const callArgs = mockFetch.mock.calls[0]!;
    expect(callArgs[0]).toBe('/api/test');
    expect(callArgs[1]!.method).toBe('POST');
    expect(callArgs[1]!.body).toBe(JSON.stringify({ name: 'test' }));
    expect(callArgs[1]!.credentials).toBe('include');
    expect(callArgs[1]!.headers.get('X-CSRF-Protection')).toBe('1');
  });

  it('apiRequest parses JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1, name: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await apiGet<{ id: number; name: string }>('/test');

    expect(result).toEqual({ id: 1, name: 'test' });
  });

  it('apiRequest throws ApiError on HTTP error', async () => {
    mockFetch.mockResolvedValue(createResponse('Not found', 404, 'Not Found', 'text/plain'));

    const promise = apiGet('/test');
    await expect(promise).rejects.toThrow(ApiError);
  });

  it('ApiError contains error details on 404', async () => {
    mockFetch.mockResolvedValueOnce(createResponse('Not found', 404, 'Not Found', 'text/plain'));

    await expect(apiGet('/test')).rejects.toThrow(/404/);
  });

  it('ApiError contains status and message', () => {
    const response = createResponse('Not found', 404, 'Not Found', 'text/plain');
    const error = new ApiError(response, 'Not found');

    expect(error.status).toBe(404);
    expect(error.message).toContain('404');
    expect(error.responseText).toBe('Not found');
  });

  it('ApiError parses code from ProblemDetails JSON', () => {
    const problemBody = JSON.stringify({
      type: 'https://httpstatuses.io/403',
      title: 'Forbidden',
      status: 403,
      detail: 'You are not a participant in this room.',
      code: 'forbidden',
    });
    const response = createResponse(problemBody, 403, 'Forbidden', 'application/problem+json');
    const error = new ApiError(response, problemBody);

    expect(error.status).toBe(403);
    expect(error.code).toBe('forbidden');
    expect(error.detail).toBe('You are not a participant in this room.');
    expect(error.message).toBe('Forbidden');
  });

  it('ApiError parses code from application/json ProblemDetails', () => {
    const problemBody = JSON.stringify({
      title: 'Room not found',
      status: 404,
      detail: "Room 'abc' not found.",
      code: 'room_not_found',
    });
    const response = createResponse(problemBody, 404, 'Not Found', 'application/json');
    const error = new ApiError(response, problemBody);

    expect(error.status).toBe(404);
    expect(error.code).toBe('room_not_found');
    expect(error.detail).toBe("Room 'abc' not found.");
    expect(error.message).toBe('Room not found');
  });

  it('ApiError handles non-JSON body', () => {
    const response = createResponse(
      'Internal Server Error',
      500,
      'Internal Server Error',
      'text/plain',
    );
    const error = new ApiError(response, 'Internal Server Error');

    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.message).toContain('500');
    expect(error.responseText).toBe('Internal Server Error');
  });

  it('apiRequest handles 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiPost('/test');

    expect(result).toBeUndefined();
  });
});
