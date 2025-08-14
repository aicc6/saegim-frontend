'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

export default function Header() {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' &&
      localStorage.getItem('theme')) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      setMode(saved);
      applyTheme(saved);
      return;
    }
    // default: light
    applyTheme('light');
  }, []);

  const applyTheme = (next: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (next === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  };

  const toggleMode = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    applyTheme(next);
    if (typeof window !== 'undefined') localStorage.setItem('theme', next);
  };

  return (
    <header className="w-full bg-sage-40 backdrop-blur-sm">
      <nav className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-soft-rose text-xl">✿</span>
          <span className="font-poetic text-2xl font-bold text-[#3F764A]">
            새김
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMode}
            aria-label="모드 전환"
            className="rounded-lg border border-sage-30 bg-white px-3 py-2 text-body text-text-primary hover:bg-sage-20"
          >
            {mode === 'light' ? '🌙 다크' : '☀️ 라이트'}
          </button>

          <Link
            href="/login"
            className="rounded-lg bg-sage-50 px-4 py-2 text-body font-semibold text-text-on-brand hover:bg-sage-60 active:bg-sage-70"
          >
            로그인
          </Link>
        </div>
      </nav>
    </header>
  );
}
