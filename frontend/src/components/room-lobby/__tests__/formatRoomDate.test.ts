import { describe, it, expect } from 'vitest';
import { formatRoomDate, formatRoomTime } from '../formatRoomDate';

describe('formatRoomDate', () => {
  it('formats a date string', () => {
    const result = formatRoomDate('2026-07-17T10:00:00Z', 'en');
    expect(result).toContain('2026');
  });

  it('formats a date string in Spanish locale', () => {
    const result = formatRoomDate('2026-07-17T10:00:00Z', 'es-ES');
    expect(result).toContain('2026');
  });
});

describe('formatRoomTime', () => {
  it('formats time from a date string', () => {
    const result = formatRoomTime('2026-07-17T10:00:00Z', 'en');
    expect(result).toContain(':');
  });

  it('formats time in Spanish locale', () => {
    const result = formatRoomTime('2026-07-17T10:00:00Z', 'es-ES');
    expect(result).toContain(':');
  });
});
