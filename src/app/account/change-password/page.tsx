'use client';

import { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';

const ChangePasswordPage = () => {
  const { isDark } = useTheme();
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
    <div
      className="flex flex-col h-screen"
      style={{
        backgroundColor: isDark ? '#111827' : '#e5f0ef',
      }}
    >
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto mt-16 p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                비밀번호 변경
              </h1>

              <div className="space-y-6">
                {/* 현재 비밀번호 입력 */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                    htmlFor="currentPassword"
                  >
                    현재 비밀번호 입력
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>

                {/* 새 비밀번호 입력 */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                    htmlFor="newPassword"
                  >
                    새 비밀번호 입력
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="새 비밀번호를 입력하세요"
                  />
                </div>

                {/* 새 비밀번호 확인 */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                    htmlFor="confirmPassword"
                  >
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
