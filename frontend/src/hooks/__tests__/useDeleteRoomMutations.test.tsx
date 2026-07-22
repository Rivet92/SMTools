import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteRoomMutations } from '../useDeleteRoomMutations';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDeleteRoomMutations', () => {
  it('calls deleteForMeFn on deleteForMe mutation', async () => {
    const deleteForMeFn = vi.fn().mockResolvedValue(undefined);
    const deleteForEveryoneFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useDeleteRoomMutations(['rooms'], deleteForMeFn, deleteForEveryoneFn),
      { wrapper: createWrapper() },
    );

    result.current.deleteForMe.mutate('room-1');
    await waitFor(() => expect(result.current.deleteForMe.isSuccess).toBe(true));
    expect(deleteForMeFn).toHaveBeenCalled();
    expect(deleteForMeFn.mock.calls[0]![0]).toBe('room-1');
  });

  it('calls deleteForEveryoneFn on deleteForEveryone mutation', async () => {
    const deleteForMeFn = vi.fn().mockResolvedValue(undefined);
    const deleteForEveryoneFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useDeleteRoomMutations(['rooms'], deleteForMeFn, deleteForEveryoneFn),
      { wrapper: createWrapper() },
    );

    result.current.deleteForEveryone.mutate('room-1');
    await waitFor(() => expect(result.current.deleteForEveryone.isSuccess).toBe(true));
    expect(deleteForEveryoneFn).toHaveBeenCalled();
    expect(deleteForEveryoneFn.mock.calls[0]![0]).toBe('room-1');
  });

  it('invalidates the query key after successful mutation', async () => {
    const deleteForMeFn = vi.fn().mockResolvedValue(undefined);
    const deleteForEveryoneFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useDeleteRoomMutations(['rooms'], deleteForMeFn, deleteForEveryoneFn),
      { wrapper: createWrapper() },
    );

    result.current.deleteForMe.mutate('room-1');
    await waitFor(() => expect(result.current.deleteForMe.isSuccess).toBe(true));
  });
});
