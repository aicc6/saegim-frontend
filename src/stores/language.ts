import { create } from 'zustand';

import { authApi } from '@/lib/api/auth';
import i18next from '@/lib/i18n';
import {
  DEFAULT_LANGUAGE,
  type LanguageCode,
  isSupportedLanguage,
} from '@/types/language';
import { useAuthStore } from './auth';

const LANGUAGE_STORAGE_KEY = 'saegim-language';
const LANGUAGE_COOKIE_NAME = 'language';
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const applyLanguage = (language: LanguageCode) => {
  if (i18next.language !== language) {
    i18next.changeLanguage(language).catch(() => {
      /* no-op */
    });
  }
};

const persistLanguage = (language: LanguageCode) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn('Failed to persist language in localStorage', error);
    }
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
  }
};

const readStoredLanguage = (): LanguageCode | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read language from localStorage', error);
  }

  return null;
};

const resolveLanguage = (
  language: LanguageCode | null | undefined,
): LanguageCode => {
  if (isSupportedLanguage(language)) {
    return language;
  }

  return readStoredLanguage() ?? DEFAULT_LANGUAGE;
};

export type Language = LanguageCode;

interface LanguageState {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  setLanguageFromServer: (language: LanguageCode | null | undefined) => void;
  hydrateFromClientStorage: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: DEFAULT_LANGUAGE,
  setLanguage: async (language: LanguageCode) => {
    const currentLanguage = get().language;
    if (currentLanguage === language) {
      return;
    }

    set({ language });
    applyLanguage(language);
    persistLanguage(language);

    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated) {
      return;
    }

    try {
      const response = await authApi.updateSettings({
        preferred_language: language,
      });
      const serverLanguage = response.data?.preferred_language;
      const syncedLanguage = isSupportedLanguage(serverLanguage)
        ? serverLanguage
        : language;

      if (syncedLanguage !== language) {
        set({ language: syncedLanguage });
        applyLanguage(syncedLanguage);
        persistLanguage(syncedLanguage);
      }

      authState.updateUser({ preferredLanguage: syncedLanguage });
    } catch (error) {
      const status = (
        error as {
          response?: { status?: number };
        }
      )?.response?.status;

      if (status === 401) {
        return;
      }

      set({ language: currentLanguage });
      applyLanguage(currentLanguage);
      persistLanguage(currentLanguage);
      console.error('Failed to update preferred language', error);
    }
  },
  setLanguageFromServer: (language: LanguageCode | null | undefined) => {
    const nextLanguage = resolveLanguage(language);
    set({ language: nextLanguage });
    applyLanguage(nextLanguage);
    persistLanguage(nextLanguage);
  },
  hydrateFromClientStorage: () => {
    const storedLanguage = readStoredLanguage();
    if (storedLanguage && storedLanguage !== get().language) {
      set({ language: storedLanguage });
      applyLanguage(storedLanguage);
    }
  },
}));
