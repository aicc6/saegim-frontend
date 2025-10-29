import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from '@/locales/en.json';
import jaTranslations from '@/locales/ja.json';
import koTranslations from '@/locales/ko.json';
import { DEFAULT_LANGUAGE } from '@/types/language';

const resources = {
  ko: {
    translation: koTranslations,
  },
  en: {
    translation: enTranslations,
  },
  ja: {
    translation: jaTranslations,
  },
};

// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
