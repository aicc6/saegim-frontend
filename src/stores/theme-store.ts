'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolveSystemTheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, _get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      resolveSystemTheme: () => {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      },
    }),
    {
      name: 'theme',
      skipHydration: true, // SSR 하이드레이션 경고 방지
    },
  ),
);
