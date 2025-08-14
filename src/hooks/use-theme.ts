'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/theme-store';

export function useTheme() {
  const { theme, setTheme, resolveSystemTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 마운트 후 초기 테마 적용
  useEffect(() => {
    setMounted(true);
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && resolveSystemTheme() === 'dark');
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme, resolveSystemTheme]);

  return {
    theme,
    setTheme,
    mounted,
    isDark:
      mounted &&
      (theme === 'dark' ||
        (theme === 'system' && resolveSystemTheme() === 'dark')),
  };
}
