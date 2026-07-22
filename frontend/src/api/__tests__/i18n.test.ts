import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { fetchLanguages, fetchTranslations } from '../i18n';

const originalFetch = globalThis.fetch;

describe('fetchLanguages', () => {
  beforeAll(() => {
    globalThis.fetch = vi.fn();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns language list on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ code: 'en', name: 'English' }]),
    } as Response);

    const languages = await fetchLanguages();
    expect(languages).toEqual([{ code: 'en', name: 'English' }]);
    expect(fetch).toHaveBeenCalledWith('/translations/languages.json');
  });

  it('throws when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    await expect(fetchLanguages()).rejects.toThrow('Failed to load languages');
  });
});

describe('fetchTranslations', () => {
  beforeAll(() => {
    globalThis.fetch = vi.fn();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns translation map on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ key: 'value' }),
    } as Response);

    const translations = await fetchTranslations('en');
    expect(translations).toEqual({ key: 'value' });
    expect(fetch).toHaveBeenCalledWith('/translations/en.json');
  });

  it('throws when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    await expect(fetchTranslations('en')).rejects.toThrow('Failed to load translations for en');
  });
});
