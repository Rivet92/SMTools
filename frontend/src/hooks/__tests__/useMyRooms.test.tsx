import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMyRooms } from '../useMyRooms';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useMyRooms', () => {
  it('returns rooms when data is available', async () => {
    const mockResponse = { items: [{ id: '1', title: 'Room 1' }], totalCount: 1, page: 1, pageSize: 20 };
    const fetchFn = vi.fn().mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useMyRooms(['test-query'], fetchFn), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it('returns isLoading initially', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 20 });
    const { result } = renderHook(() => useMyRooms(['test-isloading'], fetchFn), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
