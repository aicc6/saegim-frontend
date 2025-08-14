'use client';

import { useState } from 'react';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });

  const [emailVerified, setEmailVerified] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 닉네임 필드인 경우 한글과 영어만 허용
    if (name === 'nickname') {
      // 한글과 영어만 허용하는 정규식
      const koreanEnglishOnly = /^[가-힣a-zA-Z]*$/;
      if (value === '' || koreanEnglishOnly.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 회원가입 로직 구현
    console.log('회원가입 시도:', formData);
  };

  const handleEmailVerification = () => {
    // TODO: 이메일 인증 로직 구현
    console.log('이메일 인증 시도:', formData.email);
    setEmailVerified(true);
  };

  const handleNicknameCheck = () => {
    // TODO: 닉네임 중복 확인 로직 구현
    console.log('닉네임 중복 확인:', formData.nickname);
    setNicknameChecked(true);
  };

  // 회원가입 버튼 활성화 조건
  const isFormValid = () => {
    const hasRequiredFields =
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.nickname;
    const passwordsMatch = formData.password === formData.confirmPassword;
    const passwordLength = formData.password.length >= 9;

    // 비밀번호 복잡성 검사 (영문, 숫자, 특수문자 포함)
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
      formData.password,
    );
    const isPasswordComplex = hasLetter && hasNumber && hasSpecialChar;

    return (
      hasRequiredFields && passwordsMatch && passwordLength && isPasswordComplex
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 회원가입 안내 멘트 */}
      <div className="mt-8 text-center">
        <h2
          className="text-3xl font-serif mb-5 tracking-tight"
          style={{ color: '#5C8D89' }}
        >
          새김에 가입하세요
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
        {/* 이메일 입력 */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
              placeholder="이메일 입력"
              required
              disabled={emailVerified}
            />
            <button
              type="button"
              onClick={handleEmailVerification}
              disabled={!formData.email || emailVerified}
              className="px-4 py-3 text-white dark:text-text-dark-on-color rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
              style={{ backgroundColor: '#5C8D89' }}
            >
              {emailVerified ? '인증완료' : '인증'}
            </button>
          </div>
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
            placeholder="비밀번호 입력 (영문, 숫자, 특수문자 포함 9자 이상)"
            required
          />
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
            placeholder="비밀번호 확인"
            required
          />
        </div>

        {/* 닉네임 입력 */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
              placeholder="닉네임 입력 (한글, 영문만 가능)"
              required
              disabled={nicknameChecked}
            />
            <button
              type="button"
              onClick={handleNicknameCheck}
              disabled={!formData.nickname || nicknameChecked}
              className="px-4 py-3 text-white dark:text-text-dark-on-color rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
              style={{ backgroundColor: '#5C8D89' }}
            >
              {nicknameChecked ? '확인완료' : '중복확인'}
            </button>
          </div>
        </div>

        {/* 회원가입하기 버튼 */}
        <button
          type="submit"
          disabled={!isFormValid()}
          className="w-full text-white dark:text-text-dark-on-color py-3 px-4 rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base tracking-wide shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
          style={{ backgroundColor: '#5C8D89' }}
        >
          회원가입하기
        </button>
      </form>
    </div>
  );
}
