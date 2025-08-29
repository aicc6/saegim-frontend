/**
 * 공통 메타데이터 설정
 */

import type { Metadata } from 'next';

export const DEFAULT_METADATA: Metadata = {
  title: '새김 - 감성 AI 다이어리',
  description: 'AI와 함께 쓰는 감성 다이어리',
  keywords: ['다이어리', 'AI', '감정', '기록', '일기'],
  openGraph: {
    title: '새김 - 감성 AI 다이어리',
    description: 'AI와 함께 쓰는 감성 다이어리',
    type: 'website',
  },
};

// 페이지별 커스텀 메타데이터 생성 헬퍼
export function createPageMetadata(
  overrides: Partial<Metadata> = {},
): Metadata {
  return {
    ...DEFAULT_METADATA,
    ...overrides,
    openGraph: {
      ...DEFAULT_METADATA.openGraph,
      ...overrides.openGraph,
    },
  };
}
