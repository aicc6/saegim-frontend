'use client';

import { useRouter } from 'next/navigation';

export default function ResetPasswordErrorForm() {
  const router = useRouter();

  const handleResendEmail = () => {
    router.push('/forgot-password');
  };

  const handleGoToHelp = () => {
    router.push('/support');
  };

  return (
    <div className="space-y-6 text-center">
      {/* 에러 아이콘 */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <span className="text-4xl" role="img" aria-label="경고">
            ⚠️
          </span>
        </div>
      </div>

      {/* 에러 메시지 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
          이메일 인증 실패
        </h1>
        <p className="text-text-secondary dark:text-text-dark-secondary">
          소셜계정 사용자입니까?
          <br />
          비밀번호를 설정할 수 없습니다.
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="space-y-4 pt-4">
        {/* 에러 표시 카드 */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            소셜계정에서 이메일 알림받기로도 직접 비밀번호 설정은 불가 안내
          </p>
        </div>

        {/* 이메일 재설정 버튼 */}
        <button
          onClick={handleResendEmail}
          className="w-full saegim-button saegim-button-large"
        >
          이메일 재설정 다시 받기
        </button>

        {/* 고객센터 문의 버튼 */}
        <button
          onClick={handleGoToHelp}
          className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          고객센터 문의 안내
        </button>
      </div>
    </div>
  );
}
