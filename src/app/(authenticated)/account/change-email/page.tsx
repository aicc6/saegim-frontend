'use client';

import { useState } from 'react';

const ChangeEmailPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [profileData, setProfileData] = useState({
    nickname: '새김사용자',
    email: 'user@saegim.com',
  });

  const handlePasswordVerify = () => {
    // TODO: 현재 비밀번호 확인 API 호출
    console.log('비밀번호 확인:', currentPassword);
    setIsVerified(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = () => {
    // TODO: 프로필 업데이트 API 호출
    console.log('프로필 업데이트:', profileData);
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
              <div className="space-y-6">
                {!isVerified ? (
                  // 비밀번호 확인 단계
                  <>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                      현재 비밀번호 입력
                    </h1>
                    <div>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="현재 비밀번호를 입력하세요"
                      />
                    </div>
                    <button
                      onClick={handlePasswordVerify}
                      className="w-full saegim-button saegim-button-large"
                    >
                      프로필 업데이트
                    </button>
                  </>
                ) : (
                  // 프로필 업데이트 폼
                  <>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                      프로필 업데이트
                    </h1>
                    <div className="space-y-4">
                      {/* 닉네임 입력 */}
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                          htmlFor="nickname"
                        >
                          닉네임 입력
                        </label>
                        <input
                          type="text"
                          name="nickname"
                          value={profileData.nickname}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="닉네임을 입력하세요"
                        />
                      </div>

                      {/* 이메일 입력 */}
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                          htmlFor="email"
                        >
                          이메일 정보
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="이메일을 입력하세요"
                        />
                      </div>

                      <button
                        onClick={handleProfileUpdate}
                        className="w-full saegim-button saegim-button-large"
                      >
                        프로필 업데이트
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChangeEmailPage;
