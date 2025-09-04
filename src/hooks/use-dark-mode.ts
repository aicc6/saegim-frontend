'use client';

import { useState, useEffect } from 'react';

/**
 * 다크 모드 감지를 위한 커스텀 훅
 * HTML의 color-scheme 속성과 CSS prefers-color-scheme 미디어 쿼리를 감지합니다.
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // HTML 요소 참조
    const htmlElement = document.documentElement;

    // 초기 다크 모드 상태 확인
    const checkDarkMode = () => {
      // 1. HTML의 color-scheme 속성 확인 (우선순위 높음)
      const colorScheme =
        htmlElement.style.colorScheme ||
        getComputedStyle(htmlElement).colorScheme;

      console.log('다크 모드 감지:', {
        colorScheme,
        styleColorScheme: htmlElement.style.colorScheme,
        computedColorScheme: getComputedStyle(htmlElement).colorScheme,
      });

      if (colorScheme === 'dark') {
        setIsDarkMode(true);
        return;
      }

      if (colorScheme === 'light') {
        setIsDarkMode(false);
        return;
      }

      // 2. CSS prefers-color-scheme 미디어 쿼리 확인 (fallback)
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      setIsDarkMode(prefersDark);
    };

    // 초기 확인
    checkDarkMode();

    // 미디어 쿼리 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      checkDarkMode();
    };

    mediaQuery.addEventListener('change', handleChange);

    // MutationObserver로 HTML color-scheme 속성 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style'
        ) {
          checkDarkMode();
        }
      });
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  return isDarkMode;
}
