'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ConfirmModal from '@/components/ui/custom/ConfirmModal';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    nickname: '',
    email: '',
    profileImage: '',
    accountType: '',
    provider: '',
  });
  const [originalNickname, setOriginalNickname] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
  const [isNicknameCheckModalOpen, setIsNicknameCheckModalOpen] = useState(false);
  const [nicknameCheckResult, setNicknameCheckResult] = useState({
    available: false,
    message: '',
    nickname: ''
  });
  const [emailChangeData, setEmailChangeData] = useState({
    token: '',
    email: '',
    password: ''
  });

  // 프로필 정보 로드
  useEffect(() => {
    loadProfile();
  }, []);

  // URL 파라미터 확인 (이메일 변경 토큰)
  useEffect(() => {
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    if (token && action === 'change-email') {
      // 토큰으로 이메일 정보 가져오기
      verifyTokenAndGetEmail(token);
    }
  }, [searchParams]);

  const verifyTokenAndGetEmail = async (token: string) => {
    try {
      const response = await apiClient.get(`/api/auth/change-email/verify-token?token=${token}`);
      const data = response.data as any;
      
      if (data.valid === "true") {
        setEmailChangeData({
          token: token,
          email: data.email,
          password: ''
        });
        setIsEmailChangeModalOpen(true);
      } else {
        toast({
          title: "오류",
          description: "유효하지 않은 인증 링크입니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      toast({
        title: "오류",
        description: "인증 링크가 유효하지 않습니다.",
        variant: "destructive",
      });
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/auth/profile');
      const profile = response.data as {
        nickname: string;
        email: string;
        user_id: string;
        account_type: string;
        provider?: string;
        is_active: boolean;
      };
      
      setProfileData({
        nickname: profile.nickname,
        email: profile.email,
        profileImage: '',
        accountType: profile.account_type,
        provider: profile.provider || '',
      });
      setOriginalNickname(profile.nickname);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      toast({
        title: "오류",
        description: "프로필 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async () => {
    if (profileData.nickname === originalNickname) {
      toast({
        title: "알림",
        description: "변경된 내용이 없습니다.",
      });
      return;
    }

    try {
      setIsUpdating(true);
      await apiClient.put('/api/auth/profile', {
        nickname: profileData.nickname,
      });
      
      setOriginalNickname(profileData.nickname);
      toast({
        title: "성공",
        description: "프로필이 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      toast({
        title: "오류",
        description: "프로필 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChange = async () => {
    const newEmail = prompt('변경할 이메일 주소를 입력하세요:');
    
    if (!newEmail) {
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // 이메일 변경 인증 URL 발송
      await apiClient.post('/api/auth/change-email/send-verification', {
        new_email: newEmail
      });

      toast({
        title: "📧 인증 이메일 발송 완료!",
        description: `새로운 이메일(${newEmail})로 인증 링크를 발송했습니다.\n\n이메일을 확인하여 링크를 클릭해주세요.`,
        duration: 5000,
      });

    } catch (error: any) {
      console.error('이메일 변경 요청 실패:', error);
      const errorMsg = error.response?.data?.detail || '이메일 변경 요청에 실패했습니다.';
      toast({
        title: "오류",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChangeModalSubmit = async () => {
    if (!emailChangeData.password.trim()) {
      toast({
        title: "오류",
        description: "비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // 비밀번호 확인 후 이메일 변경
      const response = await apiClient.post('/api/auth/change-email/verify-password', {
        new_email: emailChangeData.email,
        password: emailChangeData.password,
        token: emailChangeData.token
      });

      if ((response.data as any).requires_logout === "true") {
        // 성공 메시지 표시
        toast({
          title: "🎉 이메일 변경 완료!",
          description: `이메일이 성공적으로 변경되었습니다.\n새로운 이메일: ${emailChangeData.email}\n\n보안을 위해 다시 로그인해주세요.`,
          duration: 5000,
        });
        
        // 모달 닫기
        setIsEmailChangeModalOpen(false);
        
        // URL 파라미터 정리
        router.replace('/profile');
        
        // 2초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          toast({
            title: "로그아웃",
            description: "새로운 이메일로 다시 로그인해주세요.",
            duration: 3000,
          });
          router.push('/login');
        }, 2000);
      }

    } catch (error: any) {
      console.error('이메일 변경 실패:', error);
      const errorMsg = error.response?.data?.detail || '이메일 변경에 실패했습니다.';
      toast({
        title: "오류",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = () => {
    router.push('/account/change-password');
  };

  const handleNicknameCheck = async () => {
    if (!profileData.nickname || profileData.nickname === originalNickname) {
      toast({
        title: "알림",
        description: "닉네임을 입력하거나 변경해주세요.",
      });
      return;
    }

    try {
      const response = await apiClient.get(`/api/auth/profile/check-nickname/${profileData.nickname}`);
      const result = response.data as { available: boolean; message: string };
      
      // 모달로 결과 표시
      setNicknameCheckResult({
        available: result.available,
        message: result.message,
        nickname: profileData.nickname
      });
      setIsNicknameCheckModalOpen(true);
    } catch (error) {
      console.error('닉네임 확인 실패:', error);
      toast({
        title: "오류",
        description: "닉네임 확인에 실패했습니다.",
        variant: "destructive",
      });
    }
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-background-primary dark:bg-background-dark rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-text-secondary dark:text-text-dark-secondary">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

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
                    <span className="text-6xl" role="img" aria-label="카메라">📷</span>
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
                  maxLength={10}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
                  placeholder="닉네임을 입력하세요 (2-10자)"
                />
                <button
                  onClick={handleNicknameCheck}
                  className="saegim-button saegim-button-small"
                  disabled={isUpdating}
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
                 현재 이메일
               </label>
               <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-2">
                 로그인 및 알림에 사용되는 이메일입니다. (보안상 일부가 마스킹됩니다)
                 {profileData.accountType === 'social' && (
                   <span className="block mt-1 text-orange-600 dark:text-orange-400">
                     ⚠️ 소셜 계정은 이메일 변경이 불가능합니다. {profileData.provider}에서 직접 변경해주세요.
                   </span>
                 )}
               </p>
               <div className="flex gap-2">
                 <input
                   type="email"
                   id="email"
                   name="email"
                   value={profileData.email}
                   readOnly
                   className="flex-1 px-4 py-3 bg-gray-100 dark:bg-background-dark-secondary border border-gray-300 dark:border-border-dark-subtle rounded-lg text-gray-600 dark:text-text-dark-secondary cursor-not-allowed"
                   placeholder="현재 이메일"
                 />
                 {profileData.accountType === 'email' ? (
                   <button
                     onClick={handleEmailChange}
                     className="saegim-button saegim-button-small"
                     disabled={isUpdating}
                   >
                     이메일 변경
                   </button>
                 ) : (
                   <button
                     className="px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                     disabled
                     title="소셜 계정은 이메일 변경이 불가능합니다"
                   >
                     변경 불가
                   </button>
                 )}
               </div>
             </div>
          </div>
        </div>

        {/* 프로필 업데이트 버튼 */}
        <div className="mt-8 pt-6 border-t border-border-subtle dark:border-border-dark flex justify-center">
          <button
            onClick={handleProfileUpdate}
            className="saegim-button saegim-button-medium"
            disabled={isUpdating || profileData.nickname === originalNickname}
          >
            {isUpdating ? '업데이트 중...' : '프로필 업데이트'}
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
          {profileData.accountType === 'social' && (
            <span className="block mt-2 text-orange-600 dark:text-orange-400">
              ⚠️ 소셜 계정은 비밀번호 변경이 불가능합니다. {profileData.provider}에서 직접 관리해주세요.
            </span>
          )}
        </p>
        {profileData.accountType === 'email' ? (
          <button
            onClick={handlePasswordChange}
            className="saegim-button saegim-button-medium"
          >
            비밀번호 변경
          </button>
        ) : (
          <button
            className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
            disabled
            title="소셜 계정은 비밀번호 변경이 불가능합니다"
          >
            변경 불가 (소셜 계정)
          </button>
        )}
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

             {/* 이메일 변경 모달 */}
       {isEmailChangeModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark max-w-md w-full mx-4">
             <div className="text-center mb-6">
               <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark mb-2">
                 🔐 이메일 변경 확인
               </h2>
               <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
                 <span className="font-medium">변경할 이메일:</span> <span className="font-medium text-green-600">{emailChangeData.email}</span>
               </p>
               <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                 위 이메일로 변경됩니다. 보안을 위해 현재 비밀번호를 입력해주세요.
               </p>
             </div>

             <form onSubmit={(e) => { e.preventDefault(); handleEmailChangeModalSubmit(); }} className="space-y-6">
               <div>
                 <label
                   htmlFor="password"
                   className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                 >
                   현재 비밀번호
                 </label>
                 <input
                   type="password"
                   id="password"
                   value={emailChangeData.password}
                   onChange={(e) => setEmailChangeData(prev => ({ ...prev, password: e.target.value }))}
                   className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
                   placeholder="현재 비밀번호를 입력하세요"
                   required
                 />
                 <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2">
                   ⚠️ 비밀번호 확인 후 이메일이 즉시 변경됩니다.
                 </p>
               </div>

               <div className="flex space-x-4">
                 <button
                   type="button"
                   onClick={() => setIsEmailChangeModalOpen(false)}
                   className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                 >
                   취소
                 </button>
                 <button
                   type="submit"
                   disabled={isUpdating}
                   className="flex-1 saegim-button saegim-button-medium"
                 >
                   {isUpdating ? '처리 중...' : '✅ 이메일 변경 완료'}
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* 닉네임 중복 확인 모달 */}
       {isNicknameCheckModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark max-w-md w-full mx-4">
             <div className="text-center mb-6">
               <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark mb-2">
                 {nicknameCheckResult.available ? "✅ 사용 가능" : "❌ 사용 불가"}
               </h2>
               <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
                 <span className="font-medium">확인한 닉네임:</span> <span className={`font-medium ${nicknameCheckResult.available ? 'text-green-600' : 'text-red-600'}`}>{nicknameCheckResult.nickname}</span>
               </p>
               <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                 {nicknameCheckResult.message}
               </p>
             </div>

             <div className="flex space-x-4">
               <button
                 type="button"
                 onClick={() => setIsNicknameCheckModalOpen(false)}
                 className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
               >
                 확인
               </button>
               {nicknameCheckResult.available && (
                 <button
                   type="button"
                   onClick={() => {
                     setIsNicknameCheckModalOpen(false);
                     toast({
                       title: "알림",
                       description: "닉네임이 사용 가능합니다. 프로필 업데이트 버튼을 눌러주세요.",
                     });
                   }}
                   className="flex-1 saegim-button saegim-button-medium"
                 >
                   사용하기
                 </button>
               )}
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
