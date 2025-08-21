// FCM 푸시 알림 테스트 페이지
// 개발 환경에서 FCM 기능을 테스트할 수 있는 페이지

import type { Metadata } from 'next';
import { FCMManager, FCMTestPanel } from '../../../components/dev';

export const metadata: Metadata = {
  title: 'FCM 푸시 알림 테스트 | 새김',
  description: '새김 앱의 FCM 푸시 알림 기능을 테스트하고 관리합니다.',
};

export default function FCMTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          FCM 푸시 알림 테스트
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          새김 앱의 Firebase Cloud Messaging (FCM) 푸시 알림 기능을 테스트하고
          관리할 수 있습니다. 실제 서비스에서는 백엔드 API를 통해 사용자에게
          개인화된 알림이 전송됩니다.
        </p>
      </div>

      {/* FCM API 연동 테스트 패널 */}
      <FCMTestPanel />
      
      {/* 기존 FCM 관리 컴포넌트 */}
      <div className="mt-8">
        <FCMManager />
      </div>

      {/* 사용법 안내 */}
      <div className="mt-12 max-w-4xl mx-auto">
        <div className="bg-sage-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            📱 FCM 푸시 알림 사용 가이드
          </h2>

          <div className="space-y-4 text-sm text-text-secondary">
            <div>
              <h3 className="font-medium text-text-primary mb-2">
                1. 권한 허용
              </h3>
              <p>
                브라우저에서 알림 권한을 허용해야 푸시 알림을 받을 수 있습니다.
                &apos;권한 요청&apos; 버튼을 클릭하고 브라우저 팝업에서
                &apos;허용&apos;을 선택하세요.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-2">
                2. 토큰 등록
              </h3>
              <p>
                권한이 허용되면 자동으로 FCM 토큰이 생성되고 서버에 등록됩니다.
                이 토큰을 통해 특정 사용자에게 개인화된 알림을 전송할 수
                있습니다.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-2">
                3. 테스트 알림
              </h3>
              <p>
                &apos;테스트 알림&apos; 버튼을 클릭하면 즉시 브라우저 알림이
                표시됩니다. 실제 서비스에서는 백엔드에서 사용자의 감정 상태나
                활동에 따라 적절한 알림을 전송합니다.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-2">
                4. 알림 종류
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>다이어리 작성 리마인더:</strong> 감정 기록을 위한
                  부드러운 알림
                </li>
                <li>
                  <strong>AI 콘텐츠 생성 완료:</strong> 개인화된 글귀나 조언
                  생성 알림
                </li>
                <li>
                  <strong>감정 트렌드 분석:</strong> 주간/월간 감정 패턴 리포트
                </li>
                <li>
                  <strong>기념일 알림:</strong> 첫 다이어리 작성일 등 특별한
                  순간들
                </li>
                <li>
                  <strong>친구 공유:</strong> 친구와의 감정 공유 알림 (향후
                  기능)
                </li>
              </ul>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-xs">
                <strong>참고:</strong> 이 페이지는 개발/테스트 환경용입니다.
                실제 프로덕션에서는 사용자가 직접 이 페이지에 접근할 필요가
                없으며, 앱 내에서 자연스럽게 알림 권한 요청과 관리가
                이루어집니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
