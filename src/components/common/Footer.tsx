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
      className={`py-12 ${
        isDark ? 'bg-gray-800 text-gray-300' : 'bg-sage-100 text-white'
      }`}
    >
      <div className="text-center">
        <p>&copy; 2025 새김. All rights reserved.</p>
      </div>
    </footer>
  );
}
