'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const useTheme = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useNextTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return { isDark: false }; // 기본값으로 라이트 모드 반환
  }

  return { isDark: resolvedTheme === 'dark' };
};