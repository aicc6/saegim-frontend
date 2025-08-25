'use client';

import { useEffect } from 'react';
import { initializeFCM } from '@/stores/fcm';

/**
 * FCM 초기화 프로바이더
 * 앱 전체에서 FCM을 자동으로 초기화합니다.
 */
export function FCMProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 클라이언트 사이드에서만 FCM 초기화
    if (typeof window !== 'undefined') {
      initializeFCM().catch((error) => {
        console.error('FCM 초기화 실패:', error);
      });
    }
  }, []);

  return <>{children}</>;
}