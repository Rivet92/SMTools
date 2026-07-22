export interface Language {
  code: string;
  name: string;
  isDefault: boolean;
}

export type TranslationMap = Record<string, string>;
