import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApiError } from '../../api/client';
import { useRequireRoomPassword } from '../useRequireRoomPassword';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

describe('useRequireRoomPassword', () => {
  const roomId = 'room-123';
  const lobbyPath = '/tools/planning-poker';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins room successfully and sets room', async () => {
    const mockRoom = { id: 'room-123', ownParticipantId: 'p1' };
    const joinRoom = vi.fn().mockResolvedValue(mockRoom);
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith('room-123');
    });

    await waitFor(() => {
      expect(setRoom).toHaveBeenCalledWith(mockRoom);
    });

    expect(setStoreError).toHaveBeenCalledWith(null);
  });

  it('sets joinStatus to password when joinRoom returns 403', async () => {
    const problemBody = JSON.stringify({ code: 'invalid_password' });
    const joinRoom = vi.fn().mockRejectedValue(
      new ApiError(
        new Response(problemBody, {
          status: 403,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
        problemBody,
      ),
    );
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(result.current.joinStatus).toBe('password');
    });
  });

  it('sets joinStatus to notFound when joinRoom returns 404', async () => {
    const problemBody = JSON.stringify({ code: 'room_not_found' });
    const joinRoom = vi.fn().mockRejectedValue(
      new ApiError(
        new Response(problemBody, {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
        problemBody,
      ),
    );
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(result.current.joinStatus).toBe('notFound');
    });
  });

  it('sets joinStatus to error for unknown errors', async () => {
    const joinRoom = vi.fn().mockRejectedValue(new Error('network error'));
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(result.current.joinStatus).toBe('error');
    });
  });

  it('calls navigate(lobbyPath) when handleCancel is called', () => {
    const joinRoom = vi.fn().mockRejectedValue(new Error('no join'));
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    result.current.handleCancel();

    expect(mockNavigate).toHaveBeenCalledWith(lobbyPath, { replace: true });
  });

  it('retries joining when handleRetry is called', async () => {
    const joinRoom = vi.fn().mockRejectedValue(new Error('network error'));
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(result.current.joinStatus).toBe('error');
    });

    const callsBeforeRetry = joinRoom.mock.calls.length;

    act(() => {
      result.current.handleRetry();
    });

    await waitFor(() => {
      expect(joinRoom.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
    });
  });

  it('does not redirect when password is correct', async () => {
    const mockRoom = { id: 'room-123', ownParticipantId: 'p1' };
    const apiError = new ApiError(
      new Response(JSON.stringify({ code: 'invalid_password' }), {
        status: 403,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
      JSON.stringify({ code: 'invalid_password' }),
    );
    const joinRoom = vi
      .fn()
      .mockRejectedValueOnce(apiError)
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(mockRoom);
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(result.current.joinStatus).toBe('password');
    });

    act(() => {
      result.current.setJoinPassword('correct-password');
    });

    await act(async () => {
      await result.current.handlePasswordSubmit();
    });

    expect(setRoom).toHaveBeenCalledWith(mockRoom);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error when password is incorrect', async () => {
    const apiError = new ApiError(
      new Response(JSON.stringify({ code: 'invalid_password' }), {
        status: 403,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
      JSON.stringify({ code: 'invalid_password' }),
    );
    const joinRoom = vi
      .fn()
      .mockRejectedValueOnce(apiError)
      .mockRejectedValueOnce(apiError)
      .mockRejectedValueOnce(new Error('Invalid password'));
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(result.current.joinStatus).toBe('password');
    });

    act(() => {
      result.current.setJoinPassword('wrong-password');
    });

    await act(async () => {
      await result.current.handlePasswordSubmit();
    });

    expect(result.current.error).not.toBeNull();
  });

  it('does not submit when password is empty', async () => {
    const apiError = new ApiError(
      new Response(JSON.stringify({ code: 'invalid_password' }), {
        status: 403,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
      JSON.stringify({ code: 'invalid_password' }),
    );
    const joinRoom = vi
      .fn()
      .mockRejectedValueOnce(apiError)
      .mockRejectedValueOnce(apiError)
      .mockResolvedValue({ id: 'room-123', ownParticipantId: 'p1' });
    const setRoom = vi.fn();
    const setStoreError = vi.fn();

    const { result } = renderHook(() =>
      useRequireRoomPassword({
        roomId,
        joinRoom,
        setRoom,
        setStoreError,
        lobbyPath,
        errorKey: 'rooms.error',
      }),
    );

    await waitFor(() => {
      expect(result.current.joinStatus).toBe('password');
    });

    act(() => {
      result.current.setJoinPassword('   ');
    });

    await act(async () => {
      await result.current.handlePasswordSubmit();
    });

    // Mount effect fires twice (React 19), but handlePasswordSubmit guards early
    expect(joinRoom).toHaveBeenCalledTimes(2);
  });
});
