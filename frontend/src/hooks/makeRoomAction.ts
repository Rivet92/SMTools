import { getErrorMessage } from './getErrorMessage';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

export interface MakeRoomActionOptions<TArgs extends unknown[], TResult> {
  t: TFunction;
  errorKey: string;
  setRoom?: (r: TResult) => void;
  setError: (m: string | null) => void;
  onStart?: (...args: TArgs) => void;
  onEnd?: () => void;
  rethrow?: boolean;
}

export function makeRoomAction<TArgs extends unknown[], TResult>(
  invoke: (...args: TArgs) => Promise<TResult>,
  opts: MakeRoomActionOptions<TArgs, TResult>,
): (...args: TArgs) => Promise<void> {
  return async (...args) => {
    opts.setError(null);
    opts.onStart?.(...args);
    try {
      const result = await invoke(...args);
      opts.setRoom?.(result);
    } catch (e) {
      opts.setError(opts.t(opts.errorKey, { message: getErrorMessage(e, opts.t) }));
      if (opts.rethrow) throw e;
    } finally {
      opts.onEnd?.();
    }
  };
}
