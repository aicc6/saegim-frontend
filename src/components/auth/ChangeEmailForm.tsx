'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ChangeEmailForm() {
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
    <div className="space-y-6">
      {!isVerified ? (
        // 비밀번호 확인 단계
        <>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
              현재 비밀번호 입력
            </h1>
            <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
              프로필을 변경하기 위해 현재 비밀번호를 입력해주세요
            </p>
          </div>

          <div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
              placeholder="현재 비밀번호를 입력하세요"
            />
          </div>

          <Button onClick={handlePasswordVerify} className="w-full" size="lg">
            확인
          </Button>
        </>
      ) : (
        // 프로필 업데이트 폼
        <>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
              프로필 업데이트
            </h1>
            <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
              닉네임과 이메일 정보를 변경할 수 있습니다
            </p>
          </div>

          <div className="space-y-4">
            {/* 닉네임 입력 */}
            <div>
              <label
                className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                htmlFor="nickname"
              >
                닉네임 입력
              </label>
              <input
                type="text"
                name="nickname"
                value={profileData.nickname}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
                placeholder="닉네임을 입력하세요"
              />
            </div>

            {/* 이메일 입력 */}
            <div>
              <label
                className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                htmlFor="email"
              >
                이메일 정보
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
                placeholder="이메일을 입력하세요"
              />
            </div>

            <Button onClick={handleProfileUpdate} className="w-full" size="lg">
              프로필 업데이트
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
