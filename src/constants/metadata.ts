/**
 * 공통 메타데이터 설정
 */

import type { Metadata } from 'next';

export const DEFAULT_METADATA: Metadata = {
  title: {
    default: '새김 - 감성 AI 다이어리',
    template: '%s | 새김',
  },
  description:
    'AI와 함께하는 감성 다이어리로 일상을 기록하고 감정을 분석해보세요. 개인적이고 안전한 공간에서 당신의 이야기를 써보세요.',
  keywords: [
    '다이어리',
    'AI',
    '감정',
    '기록',
    '일기',
    '감성',
    '인공지능',
    '일상',
    '개인기록',
    '마음일기',
    '감정분석',
    '새김',
    'saegim',
  ],
  authors: [{ name: '새김팀' }],
  creator: '새김팀',
  publisher: '새김',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://saegim.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: '새김 - 감성 AI 다이어리',
    description:
      'AI와 함께하는 감성 다이어리로 일상을 기록하고 감정을 분석해보세요.',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://saegim.com',
    siteName: '새김',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: '새김 - 감성 AI 다이어리',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '새김 - 감성 AI 다이어리',
    description:
      'AI와 함께하는 감성 다이어리로 일상을 기록하고 감정을 분석해보세요.',
    creator: '@saegim_official',
    images: ['/images/twitter-image.png'],
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    }),
    other: {
      ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION && {
        naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
      }),
    },
  },
  category: 'technology',
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
