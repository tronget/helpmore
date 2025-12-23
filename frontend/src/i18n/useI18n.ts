import { useCallback } from 'react';
import { useLocaleStore } from '../store/localeStore';
import {
  localeCycle,
  localeDateLocale,
  localeFlags,
  localeLabels,
  translate,
  type Locale,
} from './translations';

export const useI18n = () => {
  const { locale, setLocale } = useLocaleStore();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const cycleLocale = useCallback(() => {
    const currentIndex = localeCycle.indexOf(locale);
    const nextLocale = localeCycle[(currentIndex + 1) % localeCycle.length] ?? 'ru';
    setLocale(nextLocale as Locale);
  }, [locale, setLocale]);

  return {
    locale,
    setLocale,
    cycleLocale,
    dateLocale: localeDateLocale[locale],
    flag: localeFlags[locale],
    localeFlagsMap: localeFlags,
    localeLabelsMap: localeLabels,
    locales: localeCycle,
    t,
  };
};
