'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSendResetLink = () => {
    console.log('재설정 이메일 보내기');
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
          비밀번호 찾기
        </h1>
        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
          이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다
        </p>
      </div>

      {/* 이메일 입력 */}
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일을 입력하세요"
          className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
        />
      </div>

      {/* 재설정 이메일 보내기 버튼 */}
      <button
        onClick={handleSendResetLink}
        className="w-full saegim-button saegim-button-large"
      >
        재설정 이메일 보내기
      </button>

      {/* 로그인으로 돌아가기 버튼 */}
      <button
        onClick={handleGoToLogin}
        className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
      >
        로그인으로 돌아가기
      </button>

      {/* 회원가입하기 버튼 */}
      <button
        onClick={handleSignUp}
        className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
      >
        회원 가입하기
      </button>
    </div>
  );
}
