'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSendResetLink = () => {
    console.log('재설정 이메일 보내기');
  };

  const handleGoToLogin = () => {
    // TODO: 로그인 페이지로 이동
    console.log('로그인으로 돌아가기');
  };

  const handleSignUp = () => {
    // TODO: 회원가입 페이지로 이동
    router.push('/signup');
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{
        backgroundColor: 'var(--page-background)',
      }}
    >
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto mt-16 p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                비밀번호 찾기
              </h1>

              {/* 이메일 입력 */}
              <div className="mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 재설정 이메일 보내기 버튼 */}
              <button
                onClick={handleSendResetLink}
                className="w-full mb-4 saegim-button saegim-button-large"
              >
                재설정 이메일 보내기
              </button>

              {/* 로그인으로 돌아가기 버튼 */}
              <button
                onClick={handleGoToLogin}
                className="w-full mb-4 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                로그인으로 돌아가기
              </button>

              {/* 회원가입하기 버튼 */}
              <button
                onClick={handleSignUp}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                회원 가입하기
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
