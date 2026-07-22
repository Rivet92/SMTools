import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomAdminActions } from '../useRoomAdminActions';
import type { RoomAdminHub } from '../useRoomAdminActions';

describe('useRoomAdminActions', () => {
  const t = (key: string) => key;
  const defaultHub: RoomAdminHub<{ id: string }> = {
    makeAdmin: vi.fn(),
    removeAdmin: vi.fn(),
    removeParticipant: vi.fn(),
    updateRoomPassword: vi.fn(),
  };

  it('calls hub.updateRoomPassword and updates room on success', async () => {
    const hub = { ...defaultHub, updateRoomPassword: vi.fn().mockResolvedValue({ id: 'room-1' }) };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await result.current.handleUpdatePassword('new-password');
    });

    expect(clearErrors).toHaveBeenCalled();
    expect(hub.updateRoomPassword).toHaveBeenCalledWith('new-password');
    expect(setRoom).toHaveBeenCalledWith({ id: 'room-1' });
  });

  it('sets actionError when updateRoomPassword fails', async () => {
    const hub = {
      ...defaultHub,
      updateRoomPassword: vi.fn().mockRejectedValue(new Error('failed')),
    };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await expect(result.current.handleUpdatePassword('new-password')).rejects.toThrow('failed');
    });

    expect(setActionError).toHaveBeenCalled();
  });

  it('calls hub.makeAdmin and updates room on success', async () => {
    const hub = { ...defaultHub, makeAdmin: vi.fn().mockResolvedValue({ id: 'room-1' }) };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await result.current.handleMakeAdmin('p1');
    });

    expect(clearErrors).toHaveBeenCalled();
    expect(hub.makeAdmin).toHaveBeenCalledWith('p1');
    expect(setRoom).toHaveBeenCalledWith({ id: 'room-1' });
  });

  it('sets snackbarError when makeAdmin fails', async () => {
    const hub = { ...defaultHub, makeAdmin: vi.fn().mockRejectedValue(new Error('failed')) };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await result.current.handleMakeAdmin('p1');
    });

    expect(setSnackbarError).toHaveBeenCalled();
  });

  it('calls hub.removeAdmin and updates room on success', async () => {
    const hub = { ...defaultHub, removeAdmin: vi.fn().mockResolvedValue({ id: 'room-1' }) };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await result.current.handleRemoveAdmin('p1');
    });

    expect(clearErrors).toHaveBeenCalled();
    expect(hub.removeAdmin).toHaveBeenCalledWith('p1');
    expect(setRoom).toHaveBeenCalledWith({ id: 'room-1' });
  });

  it('sets snackbarError when removeAdmin fails', async () => {
    const hub = { ...defaultHub, removeAdmin: vi.fn().mockRejectedValue(new Error('failed')) };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await result.current.handleRemoveAdmin('p1');
    });

    expect(setSnackbarError).toHaveBeenCalled();
  });

  it('calls hub.removeParticipant and updates room on success', async () => {
    const hub = {
      ...defaultHub,
      removeParticipant: vi.fn().mockResolvedValue({ id: 'room-1' }),
    };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await result.current.handleRemoveParticipant('p1');
    });

    expect(clearErrors).toHaveBeenCalled();
    expect(hub.removeParticipant).toHaveBeenCalledWith('p1');
    expect(setRoom).toHaveBeenCalledWith({ id: 'room-1' });
  });

  it('sets snackbarError when removeParticipant fails', async () => {
    const hub = {
      ...defaultHub,
      removeParticipant: vi.fn().mockRejectedValue(new Error('failed')),
    };
    const setRoom = vi.fn();
    const setActionError = vi.fn();
    const setSnackbarError = vi.fn();
    const clearErrors = vi.fn();

    const { result } = renderHook(() =>
      useRoomAdminActions({
        hub,
        setRoom,
        t,
        errorKeyPrefix: 'test.errors',
        setActionError,
        setSnackbarError,
        clearErrors,
      }),
    );

    await act(async () => {
      await result.current.handleRemoveParticipant('p1');
    });

    expect(setSnackbarError).toHaveBeenCalled();
  });
});
