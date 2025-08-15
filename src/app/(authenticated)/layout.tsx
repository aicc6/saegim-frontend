import type { Metadata } from 'next';
import Footer from '@/components/common/Footer';
import AuthenticatedHeader from '@/components/common/AuthenticatedHeader';
import { Sidebar } from '@/components/common/Sidebar';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { MainContent } from '@/components/layout/MainContent';

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
    <SidebarProvider>
      <div className="min-h-screen bg-sage-10 dark:bg-gray-900">
        <div className="min-h-screen bg-sage-10 dark:bg-gray-900">
          <Sidebar />

          <MainContent>
            {/* 헤더 */}
            <AuthenticatedHeader />
            
            {/* 메인 콘텐츠 영역 - flex-1로 확장 */}
            <div className="flex-1">{children}</div>
            
            {/* 푸터 - 항상 바닥에 위치 */}
            <Footer />
          </MainContent>
        </div>
      </div>
    </SidebarProvider>
  );
}
