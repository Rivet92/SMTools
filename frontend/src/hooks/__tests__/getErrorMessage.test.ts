import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../getErrorMessage';

describe('getErrorMessage', () => {
  const t = (key: string) => key;

  it('returns the error message from an Error', () => {
    expect(getErrorMessage(new Error('something went wrong'), t)).toBe('something went wrong');
  });

  it('returns the fallback for unknown errors', () => {
    expect(getErrorMessage('not an error', t)).toBe('common.unknownError');
  });

  it('returns the fallback for null', () => {
    expect(getErrorMessage(null, t)).toBe('common.unknownError');
  });

  it('returns the fallback for undefined', () => {
    expect(getErrorMessage(undefined, t)).toBe('common.unknownError');
  });
});
