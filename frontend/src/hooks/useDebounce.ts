import { useCallback, useEffect, useRef } from 'react';

export interface UseDebounceResult<T extends (...args: never[]) => void> {
  debouncedCallback: (...args: Parameters<T>) => void;
  cancel: () => void;
}

export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): UseDebounceResult<T> {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { debouncedCallback, cancel };
}
