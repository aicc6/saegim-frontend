import { Metadata } from 'next';
import { createPageMetadata } from '@/constants/metadata';
import { createFAQSchema, createJsonLdScript } from '@/lib/structured-data';

export const metadata: Metadata = createPageMetadata({
  title: '새김 - AI와 함께하는 감성 다이어리',
  description:
    '일상의 소중한 순간들을 AI와 함께 기록해보세요. 감정을 분석하고 아름다운 글귀로 표현하는 개인적이고 안전한 다이어리 공간입니다.',
  keywords: [
    '새김',
    'saegim',
    'AI 다이어리',
    '감성 다이어리',
    '감정 기록',
    '인공지능 일기',
    '개인 다이어리',
    '감정 분석',
    '스마트 일기',
    '디지털 다이어리',
    'AI 글쓰기',
    '감정 인식',
    '일상 기록',
  ],
  openGraph: {
    title: '새김 - AI와 함께하는 감성 다이어리',
    description: '일상의 소중한 순간들을 AI와 함께 기록해보세요.',
    url: 'https://saegim.com/landing',
    images: [
      {
        url: '/images/landing-og.png',
        width: 1200,
        height: 630,
        alt: '새김 랜딩 페이지',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '새김 - AI와 함께하는 감성 다이어리',
    description: '일상의 소중한 순간들을 AI와 함께 기록해보세요.',
    images: ['/images/landing-twitter.png'],
  },
  alternates: {
    canonical: '/landing',
  },
});

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqSchema = createFAQSchema([
    {
      question: '새김은 어떤 서비스인가요?',
      answer:
        '새김은 AI와 함께하는 감성 다이어리 서비스입니다. 일상을 기록하고 감정을 분석하여 개인적인 성장을 도와드립니다.',
    },
    {
      question: '개인정보는 안전하게 보호되나요?',
      answer:
        '네, 모든 다이어리 내용은 암호화되어 저장되며, 개인정보 보호를 위한 최신 보안 기술을 사용합니다.',
    },
    {
      question: 'AI는 어떤 도움을 주나요?',
      answer:
        'AI가 감정을 분석하고 맞춤형 글귀를 생성하며, 감정 패턴을 통해 개인적인 통찰을 제공합니다.',
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLdScript(faqSchema)}
      />
      {children}
    </>
  );
}
