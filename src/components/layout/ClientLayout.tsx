'use client';

import { useTheme } from '@/hooks/use-theme';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mounted } = useTheme();

  // SSR 하이드레이션 경고 방지를 위해 마운트 전까지 컨텐츠를 숨김
  if (!mounted) {
    return null;
  }

  return children;
}
