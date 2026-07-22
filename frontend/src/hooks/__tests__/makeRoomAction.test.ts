import { describe, it, expect, vi } from 'vitest';
import { makeRoomAction } from '../makeRoomAction';

describe('makeRoomAction', () => {
  const t = (key: string) => key;

  it('calls the invoke function and sets the room on success', async () => {
    const invoke = vi.fn().mockResolvedValue({ id: 'room-1' });
    const setRoom = vi.fn();
    const setError = vi.fn();

    const action = makeRoomAction(invoke, { t, errorKey: 'error.key', setRoom, setError });
    await action();

    expect(invoke).toHaveBeenCalledOnce();
    expect(setRoom).toHaveBeenCalledWith({ id: 'room-1' });
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith(null);
  });

  it('sets error on failure', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('test error'));
    const setError = vi.fn();

    const action = makeRoomAction(invoke, { t, errorKey: 'error.key', setError });
    await action();

    expect(setError).toHaveBeenCalledWith('error.key');
  });

  it('rethrows when rethrow is true', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('test error'));
    const setError = vi.fn();

    const action = makeRoomAction(invoke, { t, errorKey: 'error.key', setError, rethrow: true });

    await expect(action()).rejects.toThrow('test error');
  });

  it('calls onStart and onEnd', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const setError = vi.fn();

    const action = makeRoomAction(invoke, { t, errorKey: 'error.key', setError, onStart, onEnd });
    await action('arg1');

    expect(onStart).toHaveBeenCalledWith('arg1');
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('clears error before starting', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);
    const setError = vi.fn();

    const action = makeRoomAction(invoke, { t, errorKey: 'error.key', setError });
    await action();

    expect(setError).toHaveBeenCalledWith(null);
  });
});
