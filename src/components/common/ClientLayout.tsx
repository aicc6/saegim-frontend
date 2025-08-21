'use client';

import { type ReactNode, useEffect, useState } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR 하이드레이션 경고 방지를 위해 마운트 전까지 컨텐츠를 숨김
  if (!mounted) {
    return null;
  }

  return children;
}
