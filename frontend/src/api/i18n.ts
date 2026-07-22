import type { Language, TranslationMap } from '../types/models/i18n';

export async function fetchLanguages(): Promise<Language[]> {
  const response = await fetch('/translations/languages.json');
  if (!response.ok) throw new Error('Failed to load languages');
  return response.json();
}

export async function fetchTranslations(languageCode: string): Promise<TranslationMap> {
  const response = await fetch(`/translations/${encodeURIComponent(languageCode)}.json`);
  if (!response.ok) throw new Error(`Failed to load translations for ${languageCode}`);
  return response.json();
}
