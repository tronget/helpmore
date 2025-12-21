import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Locale } from '../i18n/translations';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const localeAtom = atomWithStorage<Locale>('app.locale', 'ru');

const setLocaleAtom = atom(null, (_get, set, locale: Locale) => {
  set(localeAtom, locale);
});

export const useLocaleStore = (): LocaleState => {
  const locale = useAtomValue(localeAtom);
  const setLocale = useSetAtom(setLocaleAtom);

  return {
    locale,
    setLocale,
  };
};
