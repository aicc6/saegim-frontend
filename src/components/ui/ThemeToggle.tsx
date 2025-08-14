'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme';
import { Button } from '@/components/ui/Button';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
}

export function ThemeToggle({
  size = 'sm',
  variant = 'secondary',
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme, initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const getIcon = () => {
    if (theme === 'system') {
      return '🌓'; // 시스템 모드
    }
    return isDark ? '☀️' : '🌙';
  };

  const getTitle = () => {
    if (theme === 'system') {
      return '시스템 테마 (현재: ' + (isDark ? '다크' : '라이트') + ')';
    }
    return isDark ? '라이트 모드로 전환' : '다크 모드로 전환';
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      title={getTitle()}
      className="transition-all duration-300"
    >
      {getIcon()}
    </Button>
  );
}
