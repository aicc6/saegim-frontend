'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <footer
      className={`hidden lg:block py-12 ${
        isDark ? 'bg-gray-800 text-gray-300' : 'bg-sage-100 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
          <p className="text-sm mb-2">
            {t('footer.email')}: alswlalswl58@naver.com
          </p>
          <p className="text-xs opacity-80">{t('footer.emailNote')}</p>
        </div>
      </div>
    </footer>
  );
}
