import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomCreator } from '../useRoomCreator';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

describe('useRoomCreator', () => {
  const mockCreateRoom = vi.fn();
  const mockClearRoom = vi.fn();
  const mockUseItems = () => ({ data: [] });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles room creation successfully', async () => {
    mockCreateRoom.mockResolvedValue({ id: 'new-room-id' });

    const { result } = renderHook(() =>
      useRoomCreator(
        mockUseItems,
        () => undefined,
        mockCreateRoom,
        ['test-rooms'] as readonly string[],
        mockClearRoom,
        (id) => `/test/${id}`,
      ),
    );

    act(() => {
      result.current.setCreateTitle('New Room');
    });

    await act(async () => {
      await result.current.handleCreateRoom();
    });

    expect(mockCreateRoom).toHaveBeenCalledWith({
      title: 'New Room',
      password: undefined,
      itemId: undefined,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/test/new-room-id', { replace: true });
  });

  it('handles room creation error', async () => {
    mockCreateRoom.mockRejectedValue(new Error('Creation failed'));

    const { result } = renderHook(() =>
      useRoomCreator(
        mockUseItems,
        () => undefined,
        mockCreateRoom,
        ['test-rooms'] as readonly string[],
        mockClearRoom,
        (id) => `/test/${id}`,
      ),
    );

    act(() => {
      result.current.setCreateTitle('Failing Room');
    });

    await act(async () => {
      await result.current.handleCreateRoom();
    });

    expect(result.current.actionError).toBe('Creation failed');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
