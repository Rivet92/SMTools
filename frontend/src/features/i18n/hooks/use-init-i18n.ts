import { useEffect, useState } from 'react';
import i18n from '../../../i18n/config';
import { useLanguageStore } from '../store/languageStore';
import { useLanguages } from './use-languages';
import { useTranslations } from './useTranslations';

export function useInitI18n() {
  const [isReady, setIsReady] = useState(false);
  const { currentLanguage, setLanguages, setCurrentLanguage } = useLanguageStore();
  const { data: languages } = useLanguages();
  const { data: translations } = useTranslations(currentLanguage);

  useEffect(() => {
    if (languages) {
      setLanguages(languages);

      const isLanguageSupported = languages.some(
        (lang) => lang.code.toLowerCase() === currentLanguage.toLowerCase(),
      );
      if (!isLanguageSupported) {
        const defaultLanguage = languages.find((lang) => lang.isDefault);
        if (defaultLanguage) {
          setCurrentLanguage(defaultLanguage.code);
        }
      }
    }
  }, [languages, currentLanguage, setLanguages, setCurrentLanguage]);

  useEffect(() => {
    if (translations && currentLanguage) {
      i18n.addResourceBundle(currentLanguage, 'translation', translations, true, true);

      void (async () => {
        await i18n.changeLanguage(currentLanguage);
        setIsReady(true);
      })();
    }
  }, [translations, currentLanguage]);

  return { isReady };
}
