import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useDocumentLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language) {
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);
}
