'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCreateStore } from '@/stores/create';
import CreateChat from '@/components/individual/shw/CreateChat';
import LoadingBar from '@/components/common/loading';

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // 초기 마운트 상태 관리
  const [isInitialMount, setIsInitialMount] = useState(true);

  const {
    currentSessionId,
    loadSession,
    isLoadingSession,
    error,
    clearSession,
    clearError,
  } = useCreateStore();

  useEffect(() => {
    // 에러 상태 초기화
    if (error) {
      clearError();
    }

    // 세션 ID가 있으면 해당 세션 로드
    if (sessionId && sessionId !== currentSessionId) {
      loadSession(sessionId).finally(() => {
        // 로딩이 완료된 후 초기 마운트 상태 해제
        setIsInitialMount(false);
      });
    } else if (sessionId === currentSessionId) {
      // 이미 로드된 세션이면 바로 초기 마운트 상태 해제
      setIsInitialMount(false);
    }

    // 컴포넌트 언마운트 시 세션 정리 (선택사항)
    return () => {
      // clearSession(); // 필요에 따라 주석 해제
    };
  }, [sessionId, currentSessionId, loadSession, error, clearError]);

  // 초기 마운트 중이거나 세션 로딩 중
  if (isInitialMount || isLoadingSession) {
    return (
      <div className="bg-sage-20 flex items-center justify-center min-h-screen">
        <LoadingBar />
      </div>
    );
  }

  // 세션 로드 실패 (초기 마운트가 완료된 후에만)
  if (error && !isInitialMount) {
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

  // 세션이 로드되지 않은 경우 (초기 마운트가 완료된 후에만)
  if (!currentSessionId && !isInitialMount) {
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
