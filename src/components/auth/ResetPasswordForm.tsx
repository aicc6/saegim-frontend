'use client';

import { useState } from 'react';

export default function ResetPasswordForm() {
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // TODO: 비밀번호 불일치 에러 처리
      console.log('비밀번호가 일치하지 않습니다.');
      return;
    }
    // TODO: 비밀번호 변경 API 호출
    console.log('새 비밀번호 설정:', passwordData);
  };

  return (
    <div className="space-y-6">
      {/* 성공 아이콘 */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-sage-50/20 dark:bg-sage-50/10 rounded-full flex items-center justify-center">
          <span className="text-4xl" role="img" aria-label="이메일">✉️</span>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
          비밀번호 재설정
        </h1>
        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
          새로운 비밀번호를 입력해주세요
        </p>
      </div>

      {/* 새 비밀번호 입력 */}
      <div>
        <label
          className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
          htmlFor="newPassword"
        >
          새 비밀번호 입력
        </label>
        <input
          type="password"
          name="newPassword"
          id="newPassword"
          value={passwordData.newPassword}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
          placeholder="새 비밀번호를 입력하세요"
        />
      </div>

      {/* 새 비밀번호 확인 */}
      <div>
        <label
          className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
          htmlFor="confirmPassword"
        >
          새 비밀번호 확인
        </label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
          placeholder="새 비밀번호를 다시 입력하세요"
        />
      </div>

      {/* 비밀번호 변경 버튼 */}
      <button
        onClick={handlePasswordChange}
        className="w-full saegim-button saegim-button-large"
      >
        비밀번호 변경
      </button>
    </div>
  );
}
