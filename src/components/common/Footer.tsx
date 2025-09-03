'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
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
          <h3 className="text-lg font-semibold mb-4">연락처</h3>
          <p className="text-sm mb-2">이메일: alswlalswl58@naver.com</p>
          <p className="text-xs opacity-80">
            * 직접 이메일로 문의하시면 빠른 답변을 받으실 수 있습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
