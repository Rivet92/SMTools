import { create } from 'zustand';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../../i18n/config';
import type { Language } from '../../../types/models/i18n';

interface LanguageState {
  currentLanguage: SupportedLanguage;
  languages: Language[];
  setCurrentLanguage: (code: string) => void;
  setLanguages: (languages: Language[]) => void;
}

const normalizeLanguage = (code: string): SupportedLanguage => {
  const normalized = code.toLowerCase();

  const exactMatch = SUPPORTED_LANGUAGES.find((lang) => lang.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  const baseMatch = SUPPORTED_LANGUAGES.find((lang) => lang.toLowerCase().startsWith(normalized));
  if (baseMatch) return baseMatch;

  return DEFAULT_LANGUAGE;
};

const detectInitialLanguage = (): SupportedLanguage => {
  const saved = localStorage.getItem('smtools-language');
  if (saved) return normalizeLanguage(saved);

  return normalizeLanguage(navigator.language);
};

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: detectInitialLanguage(),
  languages: [],
  setCurrentLanguage: (code) => {
    const normalized = normalizeLanguage(code);
    localStorage.setItem('smtools-language', normalized);
    set({ currentLanguage: normalized });
  },
  setLanguages: (languages) => set({ languages }),
}));
