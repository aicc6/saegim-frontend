import { useCallback, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    // 현재 실제로 적용된 테마를 기준으로 토글
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }, [resolvedTheme, setTheme]);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const getThemeIcon = () => {
    // 실제로 적용된 테마를 기준으로 아이콘 표시
    return resolvedTheme === 'dark' ? (
      // 다크 모드일 때는 sun 아이콘 (라이트로 전환 예정)
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ) : (
      // 라이트 모드일 때는 moon 아이콘 (다크로 전환 예정)
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    );
  };

  const getThemeLabel = () => {
    return resolvedTheme === 'dark' ? '다크 모드' : '라이트 모드';
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors ${
        resolvedTheme === 'dark'
          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
          : 'text-sage-70 hover:text-sage-100 hover:bg-sage-10'
      }`}
      aria-label={`테마 변경: ${getThemeLabel()}`}
      aria-pressed={resolvedTheme === 'dark'}
    >
      <span className="sr-only">{getThemeLabel()}</span>
      {getThemeIcon()}
    </button>
  );
}
