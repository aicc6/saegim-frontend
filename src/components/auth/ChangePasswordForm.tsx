'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ChangePasswordForm() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
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
    // TODO: 비밀번호 변경 로직 구현
    console.log('비밀번호 변경:', passwordData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
          비밀번호 변경
        </h1>
        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
          계정 보안을 위한 비밀번호를 변경합니다
        </p>
      </div>

      <div className="space-y-4">
        {/* 현재 비밀번호 입력 */}
        <div>
          <label
            className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            htmlFor="currentPassword"
          >
            현재 비밀번호 입력
          </label>
          <input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
            placeholder="현재 비밀번호를 입력하세요"
          />
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
            value={passwordData.newPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
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
            value={passwordData.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
            placeholder="새 비밀번호를 다시 입력하세요"
          />
        </div>

        {/* 비밀번호 변경 버튼 */}
        <Button
          onClick={handlePasswordChange}
          className="w-full"
          size="lg"
        >
          비밀번호 변경
        </Button>
      </div>
    </div>
  );
}
