'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConfirmModal from '@/components/ui/custom/ConfirmModal';

export default function ProfileForm() {
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    nickname: '새김사용자',
    email: 'user@saegim.com',
    profileImage: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = () => {
    router.push('/account/change-email');
  };

  const handlePasswordChange = () => {
    router.push('/account/change-password');
  };

  const handleAccountDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    // TODO: 계정 탈퇴 API 호출
    console.log('계정 탈퇴 확인');
    setIsDeleteModalOpen(false);
  };

  const handleCustomerService = () => {
    router.push('/support');
  };

  return (
    <div className="space-y-8">
      {/* 프로필 정보 섹션 */}
      <div className="bg-background-primary dark:bg-background-dark rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
        <h2 className="text-xl font-medium text-text-primary dark:text-text-dark mb-6">
          프로필 정보
        </h2>

        <div className="flex space-x-6">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center min-w-[240px]">
            <div className="relative w-48 h-48 group">
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (event: ProgressEvent<FileReader>) => {
                      const result = event.target?.result;
                      if (result && typeof result === 'string') {
                        setProfileData((prev) => ({
                          ...prev,
                          profileImage: result,
                        }));
                      }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="profile-upload"
                className="cursor-pointer block w-full h-full"
              >
                <div className="w-full h-full bg-background-secondary dark:bg-background-dark-tertiary rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                  {profileData.profileImage ? (
                    <Image
                      src={profileData.profileImage}
                      alt="프로필 이미지"
                      className="w-full h-full object-cover"
                      width={192}
                      height={192}
                    />
                  ) : (
                    <span className="text-6xl" role="img" aria-label="카메라">
                      📷
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-center">
                    <svg
                      className="w-8 h-8 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm">프로필 사진 변경</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 프로필 정보 입력 */}
          <div className="flex-1 space-y-6">
            <div>
              <label
                className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                htmlFor="nickname"
              >
                닉네임 입력
              </label>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-2">
                다른 사용자에게 표시되는 이름입니다.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={profileData.nickname}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
                  placeholder="닉네임을 입력하세요"
                />
                <button
                  onClick={() => console.log('닉네임 중복 확인')}
                  className="saegim-button saegim-button-small"
                >
                  중복확인
                </button>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                htmlFor="email"
              >
                이메일 정보
              </label>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-2">
                로그인 및 알림에 사용되는 이메일입니다.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
                  placeholder="이메일을 입력하세요"
                />
                <button
                  onClick={() => console.log('이메일 중복 확인')}
                  className="saegim-button saegim-button-small"
                >
                  중복확인
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 프로필 업데이트 버튼 */}
        <div className="mt-8 pt-6 border-t border-border-subtle dark:border-border-dark flex justify-center">
          <button
            onClick={handleProfileUpdate}
            className="saegim-button saegim-button-medium"
          >
            프로필 업데이트
          </button>
        </div>
      </div>

      {/* 보안 설정 섹션 */}
      <div className="bg-background-primary dark:bg-background-dark rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
        <h2 className="text-xl font-medium text-text-primary dark:text-text-dark mb-2">
          보안 설정
        </h2>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
          계정 보안을 위한 설정을 관리합니다.
        </p>
        <button
          onClick={handlePasswordChange}
          className="saegim-button saegim-button-medium"
        >
          비밀번호 변경
        </button>
      </div>

      {/* 계정 설정 섹션 */}
      <div className="bg-background-primary dark:bg-background-dark rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
        <h2 className="text-xl font-medium text-text-primary dark:text-text-dark mb-2">
          계정 설정
        </h2>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
          계정을 탈퇴하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleAccountDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            계정 탈퇴
          </button>
          <button
            onClick={handleCustomerService}
            className="px-6 py-3 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            고객센터 문의
          </button>
        </div>
      </div>

      {/* 계정 탈퇴 확인 모달 */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="계정 탈퇴"
        message="정말로 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다."
        confirmText="예, 탈퇴하겠습니다"
        cancelText="아니오"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
