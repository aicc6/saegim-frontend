'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useLanguageStore, type Language } from '@/stores/language';

interface ProvidersProps {
  children: ReactNode;
  initialLanguage: Language;
}

export function Providers({ children, initialLanguage }: ProvidersProps) {
  const setLanguageFromServer = useLanguageStore(
    (state) => state.setLanguageFromServer,
  );
  if (i18n.language !== initialLanguage) {
    i18n.changeLanguage(initialLanguage).catch(() => {
      /* no-op: fallback handled by i18next */
    });
  }

  useEffect(() => {
    setLanguageFromServer(initialLanguage);
    if (i18n.language !== initialLanguage) {
      i18n.changeLanguage(initialLanguage).catch(() => {
        /* no-op: fallback handled by i18next */
      });
    }
  }, [initialLanguage, setLanguageFromServer]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange={false}
        storageKey="saegim-theme"
        forcedTheme={undefined}
        themes={['light', 'dark', 'system']}
      >
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
}
