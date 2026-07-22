import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the debounced callback after the delay', () => {
    vi.useFakeTimers();
    const fn = vi.fn();

    const { result } = renderHook(() => useDebounce(fn, 500));
    act(() => {
      result.current.debouncedCallback();
    });

    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('cancels the pending call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();

    const { result } = renderHook(() => useDebounce(fn, 500));
    act(() => {
      result.current.debouncedCallback();
    });

    act(() => {
      result.current.cancel();
    });

    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it('resets the timer on each call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();

    const { result } = renderHook(() => useDebounce(fn, 500));
    act(() => {
      result.current.debouncedCallback();
    });
    vi.advanceTimersByTime(300);
    act(() => {
      result.current.debouncedCallback();
    });
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
  });
});
