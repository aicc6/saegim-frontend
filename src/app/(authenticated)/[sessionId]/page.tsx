'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCreateStore } from '@/stores/create';
import CreateChat from '@/components/individual/shw/CreateChat';

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const {
    currentSessionId,
    loadSession,
    isLoadingSession,
    error,
    clearSession,
  } = useCreateStore();

  useEffect(() => {
    // 세션 ID가 있으면 해당 세션 로드
    if (sessionId && sessionId !== currentSessionId) {
      loadSession(sessionId);
    }

    // 컴포넌트 언마운트 시 세션 정리 (선택사항)
    return () => {
      // clearSession(); // 필요에 따라 주석 해제
    };
  }, [sessionId, currentSessionId, loadSession]);

  // 세션 로딩 중
  if (isLoadingSession) {
    return (
      <div className="bg-sage-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-sage-30 border-t-sage-70"></div>
          <p className="mt-2 text-sm text-gray-500">세션을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 세션 로드 실패
  if (error) {
    return (
      <div className="bg-background-primary flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">
            세션을 불러올 수 없습니다
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-sage-90 text-white rounded-lg hover:bg-sage-100"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 세션이 로드되지 않은 경우
  if (!currentSessionId) {
    return (
      <div className="bg-background-primary flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-4">
            세션을 찾을 수 없습니다
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-sage-90 text-white rounded-lg hover:bg-sage-100"
          >
            새 대화 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 정상적으로 세션이 로드된 경우 CreateChat 컴포넌트 렌더링
  return (
    <div className="bg-sage-20">
      <CreateChat />
    </div>
  );
}
