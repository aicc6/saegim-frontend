'use client';

import { Suspense } from 'react';
import CreateAi from '@/components/creatAi/CreateAi';

function HomeContent() {
  // AuthGuard가 이미 인증을 확인하므로 여기서는 단순히 메인 콘텐츠만 렌더링
  console.log('🎨 CreateAi 컴포넌트 렌더링 시작');

  return (
    <div className="bg-sage-20 flex items-center justify-center flex-1">
      <main className="w-full max-w-2xl px-4 py-4 animate-page-transition">
        <CreateAi />
      </main>
    </div>
  );
}

export default function Home() {
  console.log('🏠 Home 컴포넌트 렌더링');

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sage-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-50 mx-auto mb-4"></div>
            <p className="text-sage-80 dark:text-gray-300">로딩 중...</p>
            <p className="text-sm text-gray-500 mt-2">
              Suspense fallback 실행 중
            </p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
