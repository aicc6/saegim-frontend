export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = 'ko';

export const isSupportedLanguage = (value: unknown): value is LanguageCode =>
  typeof value === 'string' &&
  SUPPORTED_LANGUAGES.includes(value as LanguageCode);
