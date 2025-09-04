'use client';

import { Suspense } from 'react';

import CreateAi from '@/components/creatAi/CreateAi';
import { getLogger } from '@/lib';

const logger = getLogger('home');

function HomeContent() {
  // AuthGuard가 이미 인증을 확인하므로 여기서는 단순히 메인 콘텐츠만 렌더링
  logger.debug('CreateAi 컴포넌트 렌더링 시작');

  return (
    <div className="flex bg-sage-20 dark:bg-background-dark items-center justify-center min-h-dvh">
      <main className="w-full max-w-2xl px-4 animate-page-transition">
        <CreateAi />
      </main>
    </div>
  );
}

export default function Home() {
  logger.debug('Home 컴포넌트 렌더링');

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-primary dark:bg-background-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-50 mx-auto mb-4"></div>
            <p className="text-text-primary dark:text-text-primary-dark">
              로딩 중...
            </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-2">
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
