const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: string;
  readonly responseText: string;

  constructor(response: Response, body: string) {
    const contentType = response.headers.get('Content-Type') ?? '';
    const isProblemJson = contentType.includes('problem+json');

    let code: string | undefined;
    let detail: string | undefined;
    let message: string;

    if (isProblemJson || contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(body) as ProblemDetails;
        code = parsed.code;
        detail = parsed.detail;
        message = parsed.title || `${response.status} ${response.statusText}`;
      } catch {
        message = `${response.status} ${response.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`;
      }
    } else {
      message = `${response.status} ${response.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`;
    }

    super(message);
    this.name = 'ApiError';
    this.status = response.status;
    this.code = code;
    this.detail = detail;
    this.responseText = body;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('X-CSRF-Protection')) {
    headers.set('X-CSRF-Protection', '1');
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json') || contentType.includes('problem+json');

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response, text);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!isJson) {
    const text = await response.text();
    if (!text) return undefined as T;
    throw new ApiError(response, text);
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'POST', body });
}

export function apiPut<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'PUT', body });
}

export function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'DELETE' });
}
