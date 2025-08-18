'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleLoginButton from '@/components/ui/custom/GoogleLoginButton';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 데모 계정 정보
  const DEMO_ACCOUNT = {
    email: 'demo@saegim.com',
    password: 'saegim2024',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 데모 계정 로그인 체크
    if (
      formData.email === DEMO_ACCOUNT.email &&
      formData.password === DEMO_ACCOUNT.password
    ) {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/');
    } else {
      alert(
        '데모 계정 정보가 일치하지 않습니다.\n이메일: demo@saegim.com\n비밀번호: saegim2024',
      );
    }
  };

  const handleGoogleLogin = () => {
    // TODO: 구글 로그인 로직 구현
    console.log('구글 로그인 시도');
  };

  const handleFindPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 로그인 안내 멘트 */}
      <div className="mt-8 text-center">
        <h2
          className="text-3xl font-serif mb-5 tracking-tight"
          style={{ color: '#5C8D89' }}
        >
          새김에 오신 것을 환영합니다
        </h2>
        <div className="mb-10 space-y-2 text-[#7BA098] dark:text-background-dark-brand/80 transition-colors">
          <p className="text-base font-light tracking-wide">
            AI와 함께하는 감성 다이어리로
          </p>
          <p className="text-base font-light tracking-wide">
            일상을 기록해보세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 아이디(메일계정) 입력 */}
        <div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
            placeholder="아이디(메일계정) 입력"
            required
            aria-describedby="email-help"
          />
          <p id="email-help" className="sr-only">
            이메일 주소를 입력해주세요
          </p>
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
            placeholder="비밀번호 입력"
            required
            aria-describedby="password-help"
          />
          <p id="password-help" className="sr-only">
            비밀번호를 입력해주세요
          </p>
        </div>

        {/* 로그인하기 버튼 */}
        <button
          type="submit"
          className="w-full saegim-button saegim-button-large"
        >
          로그인하기
        </button>

        {/* 구글 로그인 버튼 */}
        <GoogleLoginButton onClick={handleGoogleLogin} />

        {/* 비밀번호 찾기 */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={handleFindPassword}
            className="text-gray-600 dark:text-text-dark-primary hover:text-sage-50 dark:hover:text-text-dark-inverse font-light text-sm tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary rounded-lg px-3 py-1 hover:bg-gray-100 dark:hover:bg-background-dark-hover"
            aria-label="비밀번호 찾기"
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 데모 계정 안내 */}
        <div className="text-center mt-6 p-4 bg-gray-50 dark:bg-background-dark-tertiary rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
            데모 계정으로 체험해보세요
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
            demo@saegim.com / saegim2024
          </p>
        </div>
      </form>
    </div>
  );
}
