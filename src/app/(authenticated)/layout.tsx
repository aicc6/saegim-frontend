import type { Metadata } from 'next';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';

import '../globals.css';

export const metadata: Metadata = {
  title: '새김 - 감성 AI 다이어리',
  description: 'AI와 함께 쓰는 감성 다이어리',
  keywords: ['다이어리', 'AI', '감정', '기록', '일기'],
  openGraph: {
    title: '새김 - 감성 AI 다이어리',
    description: 'AI와 함께 쓰는 감성 다이어리',
    type: 'website',
  },
};

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-sage-10">
      <div className="min-h-screen bg-sage-10">
        <Navigation />
        <main className="lg:pl-64 pb-16 lg:pb-0">
          {/* 헤더 */}
          <AuthenticatedHeader />
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
}
