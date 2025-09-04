'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ConfirmModal from '@/components/ui/custom/ConfirmModal';
import { FormInput } from '@/components/ui/form-input';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { getLogger } from '@/lib/logger';
import { useAuthStore } from '@/stores/auth';
import { apiClient } from '@/lib/api/client';

const logger = getLogger('ProfileForm');

export default function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { updateUser, user: authUser } = useAuthStore();
  const [profileData, setProfileData] = useState({
    nickname: '',
    email: '',
    profileImage: '',
    accountType: '',
    provider: '',
  });
  const [originalNickname, setOriginalNickname] = useState('');
  const [originalProfileImage, setOriginalProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
  const [isNicknameCheckModalOpen, setIsNicknameCheckModalOpen] =
    useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [nicknameCheckResult, setNicknameCheckResult] = useState({
    available: false,
    message: '',
    nickname: '',
  });
  const [emailChangeData, setEmailChangeData] = useState({
    token: '',
    email: '',
    password: '',
  });

  const verifyTokenAndGetEmail = useCallback(
    async (token: string) => {
      try {
        const response = await authApi.verifyEmailToken(token);
        const data = response.data;

        if (data.valid === 'true') {
          setEmailChangeData({
            token: token,
            email: data.email || '',
            password: '',
          });
          setIsEmailChangeModalOpen(true);
        } else {
          toast({
            title: '오류',
            description: '유효하지 않은 인증 링크입니다.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        logger.error('토큰 검증 실패', { error });
        toast({
          title: '오류',
          description: '인증 링크가 유효하지 않습니다.',
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getCurrentUser();
      const profile = response.data;

      // 프로필 이미지 우선순위: localStorage > 서버 데이터 > 전역 상태
      let profileImage = profile.profile_image || authUser?.profileImage || '';

      // localStorage에서 프로필 이미지 확인 및 복원
      if (typeof window !== 'undefined') {
        try {
          // 여러 저장소에서 확인
          const storageKeys = [
            'saegim-profile-image',
            'saegim-profile-image-backup',
            'saegim-user-profile-image',
            'user-profile-image-saegim',
          ];

          let foundImage = null;
          for (const key of storageKeys) {
            const savedImage = localStorage.getItem(key);
            if (savedImage) {
              foundImage = savedImage;
              logger.info(
                `ProfileForm: ${key}에서 프로필 이미지 복원됨:`,
                savedImage,
              );
              break;
            }
          }

          if (foundImage) {
            profileImage = foundImage;
            // 메인 저장소로 복원
            localStorage.setItem('saegim-profile-image', foundImage);
          } else {
            logger.info(
              'ProfileForm: 저장된 프로필 이미지 없음, 서버 데이터 사용:',
              profile.profile_image,
            );
          }
        } catch (error) {
          logger.warn('ProfileForm: 프로필 이미지 복원 실패:', error);
        }
      }

      setProfileData({
        nickname: profile.nickname,
        email: profile.email,
        profileImage: profileImage,
        accountType: profile.account_type,
        provider: profile.provider || '',
      });
      setOriginalNickname(profile.nickname);
      setOriginalProfileImage(profileImage);

      // 전역 상태도 복원된 프로필 이미지로 동기화
      updateUser({
        nickname: profile.nickname,
        profileImage: profileImage,
      });
    } catch (error) {
      logger.error('프로필 로드 실패', { error });
      toast({
        title: '오류',
        description: '프로필 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, authUser?.profileImage, updateUser]);

  // 프로필 정보 로드
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // URL 파라미터 확인 (이메일 변경 토큰)
  useEffect(() => {
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    if (token && action === 'change-email') {
      // 토큰으로 이메일 정보 가져오기
      verifyTokenAndGetEmail(token);
    }
  }, [searchParams, verifyTokenAndGetEmail]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileImageUpload = async (file: File) => {
    try {
      setIsImageUploading(true);

      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '오류',
          description: '파일 크기는 5MB 이하여야 합니다.',
          variant: 'destructive',
        });
        return;
      }

      // 파일 형식 검증
      if (!file.type.startsWith('image/')) {
        toast({
          title: '오류',
          description: '이미지 파일만 업로드 가능합니다.',
          variant: 'destructive',
        });
        return;
      }

      // 프로필 이미지 전용 업로드 API 사용
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.upload(
        '/api/auth/profile/upload-image',
        formData,
      );

      logger.info('업로드 응답 전체 구조:', {
        response: response,
        responseData: response.data,
        responseType: typeof response.data,
        responseKeys: response.data ? Object.keys(response.data) : [],
        fullResponse: JSON.stringify(response, null, 2),
      });

      // 응답 구조 상세 분석
      logger.info('응답 구조 상세 분석:', {
        'response.success': response.success,
        'response.message': response.message,
        'response.timestamp': response.timestamp,
        'response.request_id': response.request_id,
        'response.data type': typeof response.data,
        'response.data value': response.data,
        'response.data keys': response.data
          ? Object.keys(response.data)
          : 'N/A',
        'response.data stringified': JSON.stringify(response.data, null, 2),
      });

      // 다양한 응답 구조 처리
      let imageUrl: string | null = null;

      // 1. response.data.image_url 확인
      if (
        response.data &&
        typeof response.data === 'object' &&
        'image_url' in response.data
      ) {
        imageUrl = (response.data as { image_url: string }).image_url;
        logger.info('이미지 URL을 response.data.image_url에서 찾음:', imageUrl);
      }
      // 2. response.data 자체가 URL인 경우
      else if (response.data && typeof response.data === 'string') {
        imageUrl = response.data;
        logger.info('이미지 URL을 response.data에서 찾음 (문자열):', imageUrl);
      }
      // 3. response 자체에 image_url이 있는 경우
      else if ('image_url' in response) {
        imageUrl = (response as { image_url: string }).image_url;
        logger.info('이미지 URL을 response.image_url에서 찾음:', imageUrl);
      }
      // 4. response.data가 객체인 경우 다양한 필드명 시도
      else if (response.data && typeof response.data === 'object') {
        const possibleFields = [
          'image_url',
          'imageUrl',
          'url',
          'profile_image',
          'profileImage',
          'image',
          'file_url',
          'fileUrl',
          'upload_url',
          'uploadUrl',
          'path',
          'filename',
          'location',
          'uri',
          'link',
          'file_path',
          'image_path',
          'thumbnail_url',
          'thumbnailUrl',
        ];

        for (const field of possibleFields) {
          if (
            field in response.data &&
            typeof (response.data as Record<string, unknown>)[field] ===
              'string'
          ) {
            imageUrl = (response.data as Record<string, string>)[field];
            logger.info(
              `이미지 URL을 response.data.${field}에서 찾음:`,
              imageUrl,
            );
            break;
          }
        }
      }
      // 5. response 자체에서 다양한 필드명 시도
      else {
        const possibleFields = [
          'image_url',
          'imageUrl',
          'url',
          'profile_image',
          'profileImage',
          'image',
          'file_url',
          'fileUrl',
          'upload_url',
          'uploadUrl',
          'path',
          'filename',
          'location',
          'uri',
          'link',
          'file_path',
          'image_path',
          'thumbnail_url',
          'thumbnailUrl',
        ];

        for (const field of possibleFields) {
          if (
            field in (response as unknown as Record<string, unknown>) &&
            typeof (response as unknown as Record<string, unknown>)[field] ===
              'string'
          ) {
            imageUrl = (response as unknown as Record<string, string>)[field];
            logger.info(`이미지 URL을 response.${field}에서 찾음:`, imageUrl);
            break;
          }
        }
      }

      if (imageUrl) {
        // 즉시 UI에 반영 (업로드된 이미지 URL 사용)
        setProfileData((prev) => ({
          ...prev,
          profileImage: imageUrl as string,
        }));

        setOriginalProfileImage(imageUrl as string);

        // 전역 상태 즉시 업데이트 (사이드바 등에 즉시 반영)
        updateUser({ profileImage: imageUrl as string });

        // 프로필 이미지를 localStorage에 별도로 저장 (로그아웃 후에도 유지)
        if (typeof window !== 'undefined') {
          try {
            // 메인 저장소에 저장
            localStorage.setItem('saegim-profile-image', imageUrl);
            logger.info('프로필 이미지를 localStorage에 저장:', imageUrl);

            // 백업 저장소에도 저장
            localStorage.setItem('saegim-profile-image-backup', imageUrl);
            logger.info('프로필 이미지 백업 저장 완료');

            // 추가 보안: 여러 키로 저장
            localStorage.setItem('saegim-user-profile-image', imageUrl);
            localStorage.setItem('user-profile-image-saegim', imageUrl);

            // 저장 확인
            const savedImage = localStorage.getItem('saegim-profile-image');
            const backupImage = localStorage.getItem(
              'saegim-profile-image-backup',
            );
            if (savedImage === imageUrl && backupImage === imageUrl) {
              logger.info('프로필 이미지 localStorage 저장 확인 성공');
            } else {
              logger.warn('프로필 이미지 localStorage 저장 확인 실패');
            }
          } catch (error) {
            logger.error('프로필 이미지 localStorage 저장 실패:', error);
          }
        }

        // 디버깅을 위한 로그
        logger.info('전역 상태 업데이트 완료:', {
          profileImage: imageUrl,
          timestamp: new Date().toISOString(),
        });

        // 전역 상태 업데이트 확인 및 사이드바 강제 리렌더링
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          logger.info('전역 상태 업데이트 확인:', {
            currentProfileImage: currentUser?.profileImage,
            expectedProfileImage: imageUrl,
            isMatch: currentUser?.profileImage === imageUrl,
          });

          // 사이드바 강제 리렌더링을 위한 이벤트 발생
          window.dispatchEvent(
            new CustomEvent('sidebar-force-update', {
              detail: { profileImage: imageUrl, timestamp: Date.now() },
            }),
          );

          // 추가로 전역 상태 변경 이벤트도 발생
          window.dispatchEvent(
            new CustomEvent('auth-update', {
              detail: { user: currentUser },
            }),
          );

          // 전역 상태를 다시 한 번 강제로 업데이트
          if (currentUser && currentUser.profileImage !== imageUrl) {
            logger.warn('전역 상태 불일치 감지, 재업데이트 시도');
            updateUser({ profileImage: imageUrl as string });
          }
        }, 100);

        // 성공 안내 토스트 표시
        toast({
          title: '✅ 프로필 이미지 업로드 완료',
          description:
            '프로필 이미지가 성공적으로 업로드되었습니다. 사이드바에도 반영됩니다.',
          duration: 3000,
        });

        logger.info('프로필 사진 업로드 성공:', imageUrl);
      } else {
        // 이미지 URL을 찾지 못한 경우 추가 시도
        logger.warn('기본 경로에서 이미지 URL을 찾지 못함, 추가 시도 중...');

        // 다양한 필드명으로 시도
        const possibleFields = [
          'image_url',
          'imageUrl',
          'url',
          'profile_image',
          'profileImage',
          'image',
          'file_url',
          'fileUrl',
          'upload_url',
          'uploadUrl',
          'path',
          'filename',
          'location',
          'uri',
          'link',
        ];

        for (const field of possibleFields) {
          if (
            response.data &&
            typeof response.data === 'object' &&
            response.data !== null &&
            field in response.data &&
            typeof (response.data as Record<string, unknown>)[field] ===
              'string'
          ) {
            imageUrl = (response.data as Record<string, string>)[field];
            logger.info(`이미지 URL을 ${field} 필드에서 찾음:`, imageUrl);
            break;
          }
        }

        if (imageUrl) {
          // 이미지 URL을 찾았으면 처리 계속
          setProfileData((prev) => ({
            ...prev,
            profileImage: imageUrl as string,
          }));

          setOriginalProfileImage(imageUrl as string);
          updateUser({ profileImage: imageUrl as string });

          // localStorage에 저장
          if (typeof window !== 'undefined') {
            try {
              const storageKeys = [
                'saegim-profile-image',
                'saegim-profile-image-backup',
                'saegim-user-profile-image',
                'user-profile-image-saegim',
              ];

              storageKeys.forEach((key) => {
                localStorage.setItem(key, imageUrl as string);
              });

              logger.info('프로필 이미지를 localStorage에 저장됨:', imageUrl);
            } catch (error) {
              logger.error('프로필 이미지 localStorage 저장 실패:', error);
            }
          }

          toast({
            title: '✅ 프로필 이미지 업로드 완료',
            description: '프로필 이미지가 성공적으로 업로드되었습니다.',
            duration: 3000,
          });

          logger.info('프로필 사진 업로드 성공 (대체 필드):', imageUrl);
        } else {
          // 이미지 URL을 찾지 못한 경우 상세한 디버깅 정보 제공
          logger.error('이미지 URL을 찾을 수 없음 - 상세 디버깅 정보:', {
            'response 전체': response,
            'response.data': response.data,
            'response.data 타입': typeof response.data,
            'response.data 값': response.data,
            'response.data 키들': response.data
              ? Object.keys(response.data as Record<string, unknown>)
              : 'N/A',
            'response 키들': Object.keys(
              response as unknown as Record<string, unknown>,
            ),
            'response.success': response.success,
            'response.message': response.message,
            'response.timestamp': response.timestamp,
            'response.request_id': response.request_id,
            '전체 응답 JSON': JSON.stringify(response, null, 2),
          });

          throw new Error(
            `업로드 응답에서 이미지 URL을 찾을 수 없습니다. 응답 구조: ${JSON.stringify(response, null, 2)}`,
          );
        }
      }
    } catch (error) {
      logger.error('프로필 사진 업로드 실패:', error);
      toast({
        title: '오류',
        description: '프로필 사진 업로드에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (
      profileData.nickname === originalNickname &&
      profileData.profileImage === originalProfileImage
    ) {
      toast({
        title: '알림',
        description: '변경된 내용이 없습니다.',
      });
      return;
    }

    try {
      setIsUpdating(true);

      // 프로필 업데이트 API 호출
      await authApi.updateProfile({
        nickname: profileData.nickname,
        profile_image_url: profileData.profileImage,
      });

      // 로컬 상태 업데이트
      setOriginalNickname(profileData.nickname);
      setOriginalProfileImage(profileData.profileImage);

      // 전역 상태 동기화 (사이드바 등에 반영)
      updateUser({
        nickname: profileData.nickname,
        profileImage: profileData.profileImage,
      });

      // 프로필 이미지를 localStorage에도 저장 (업데이트 시에도)
      if (profileData.profileImage && typeof window !== 'undefined') {
        try {
          const storageKeys = [
            'saegim-profile-image',
            'saegim-profile-image-backup',
            'saegim-user-profile-image',
            'user-profile-image-saegim',
          ];

          storageKeys.forEach((key) => {
            localStorage.setItem(key, profileData.profileImage);
          });

          logger.info(
            'ProfileForm: 프로필 업데이트 시 localStorage에 저장됨:',
            profileData.profileImage,
          );
        } catch (error) {
          logger.warn(
            'ProfileForm: 프로필 업데이트 시 localStorage 저장 실패:',
            error,
          );
        }
      }

      toast({
        title:
          profileData.nickname !== originalNickname
            ? `✅ 닉네임 변경 완료`
            : '✅ 프로필 업데이트 완료',
        description:
          profileData.nickname !== originalNickname
            ? `닉네임이 "${originalNickname}"에서 "${profileData.nickname}"으로 변경되었습니다.`
            : '프로필이 성공적으로 업데이트되었습니다.',
        duration: 4000,
      });

      logger.info('프로필 업데이트 완료');
    } catch (error) {
      logger.error('프로필 업데이트 실패:', error);
      toast({
        title: '오류',
        description: '프로필 업데이트에 실패했습니다.',
        variant: 'destructive',
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
        title: '오류',
        description: '올바른 이메일 형식을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);

      // 이메일 변경 인증 URL 발송
      await authApi.sendEmailChangeVerification({
        new_email: newEmail,
      });

      toast({
        title: '📧 인증 이메일 발송 완료!',
        description: `새로운 이메일(${newEmail})로 인증 링크를 발송했습니다.\n\n이메일을 확인하여 링크를 클릭해주세요.`,
        duration: 5000,
      });
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          data?: { detail?: string };
        };
        [key: string]: unknown;
      };
      logger.error('이메일 변경 요청 실패', { error });
      const errorMsg =
        apiError.response?.data?.detail || '이메일 변경 요청에 실패했습니다.';
      toast({
        title: '오류',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChangeModalSubmit = async () => {
    if (!emailChangeData.password.trim()) {
      toast({
        title: '오류',
        description: '비밀번호를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);

      // 비밀번호 확인 후 이메일 변경
      const response = await authApi.verifyEmailChangePassword({
        new_email: emailChangeData.email,
        password: emailChangeData.password,
        token: emailChangeData.token,
      });

      const responseData = response.data;

      if (responseData.requires_logout === 'true') {
        // 성공 메시지 표시
        toast({
          title: '🎉 이메일 변경 완료!',
          description: `이메일이 성공적으로 변경되었습니다.\n새로운 이메일: ${emailChangeData.email}\n\n보안을 위해 다시 로그인해주세요.`,
          duration: 5000,
        });

        // 모달 닫기
        setIsEmailChangeModalOpen(false);

        // URL 파라미터 정리
        router.replace('/profile');

        // 2초 후 랜딩 페이지로 리다이렉트
        setTimeout(() => {
          toast({
            title: '로그아웃',
            description: '새로운 이메일로 다시 로그인해주세요.',
            duration: 3000,
          });
          router.push('/landing?status=logout');
          // 클라이언트 상태 완전 정리를 위해 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }, 2000);
      }
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          data?: { detail?: string };
        };
        [key: string]: unknown;
      };
      logger.error('이메일 변경 실패', { error });
      const errorMsg =
        apiError.response?.data?.detail || '이메일 변경에 실패했습니다.';
      toast({
        title: '오류',
        description: errorMsg,
        variant: 'destructive',
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
        title: '알림',
        description: '닉네임을 입력하거나 변경해주세요.',
      });
      return;
    }

    try {
      const response = await authApi.checkNickname(profileData.nickname);
      const result = response.data;

      // 모달로 결과 표시
      setNicknameCheckResult({
        available: result.available,
        message: result.message,
        nickname: profileData.nickname,
      });
      setIsNicknameCheckModalOpen(true);
    } catch (error) {
      logger.error('닉네임 확인 실패', { error });
      toast({
        title: '오류',
        description: '닉네임 확인에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleAccountDelete = () => {
    // 계정 타입에 따라 다른 처리
    if (profileData.accountType === 'email') {
      // 이메일 계정: 비밀번호 입력 모달 표시
      setIsPasswordModalOpen(true);
    } else {
      // 소셜 계정: 바로 탈퇴 확인 모달 표시
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsUpdating(true);

      // 계정 타입에 따라 다른 요청 데이터
      const requestData =
        profileData.accountType === 'email'
          ? { password: withdrawPassword }
          : { password: '' };

      // 탈퇴 API 호출
      const response = await authApi.withdraw(requestData);

      // API 응답이 성공인지 확인
      if (response && response.success) {
        // 성공 토스트 메시지 (5.5초 표시)
        toast({
          title: '✅ 계정 탈퇴 완료',
          description:
            '계정이 성공적으로 탈퇴되었습니다. 30일 이내에 복구할 수 있으며, 그 이후에는 모든 데이터가 영구적으로 삭제됩니다.',
          duration: 5500, // 5.5초
        });

        // 모달 닫기
        setIsDeleteModalOpen(false);
        setIsPasswordModalOpen(false);
        setWithdrawPassword('');

        // 5.5초 후 랜딩 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/landing');
          // 클라이언트 상태 완전 정리를 위해 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }, 5500);
      } else {
        throw new Error('탈퇴 처리에 실패했습니다.');
      }
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          data?: { detail?: string };
        };
        message?: string;
        [key: string]: unknown;
      };
      logger.error('탈퇴 실패', { error });

      // 401 에러인 경우 (토큰 만료 또는 사용자 삭제됨) 랜딩 페이지로 리다이렉트
      if (apiError.message && apiError.message.includes('401')) {
        // 모달 닫기
        setIsDeleteModalOpen(false);
        setIsPasswordModalOpen(false);
        setWithdrawPassword('');

        // 401 에러 시에도 탈퇴 완료 토스트 표시 (5.5초)
        toast({
          title: '✅ 계정 탈퇴 완료',
          description:
            '계정이 성공적으로 탈퇴되었습니다. 30일 이내에 복구할 수 있으며, 그 이후에는 모든 데이터가 영구적으로 삭제됩니다.',
          duration: 5500, // 5.5초
        });

        // 5.5초 후 랜딩 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/landing');
          // 클라이언트 상태 완전 정리를 위해 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }, 5500);
        return;
      }

      // 다른 에러의 경우 에러 토스트 메시지
      toast({
        title: '탈퇴 실패',
        description:
          apiError.response?.data?.detail ||
          '탈퇴 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordConfirm = () => {
    if (!withdrawPassword.trim()) {
      toast({
        title: '입력 오류',
        description: '비밀번호를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 비밀번호 입력 모달 닫고 탈퇴 확인 모달 표시
    setIsPasswordModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleCustomerService = () => {
    router.push('/support');
  };

  // 이메일 마스킹 함수
  const maskEmail = (email: string): string => {
    if (!email || !email.includes('@')) return email;

    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.length > 2
        ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
        : localPart;

    return `${maskedLocal}@${domain}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* 프로필 정보 섹션 - 로딩 중에도 기본 구조 표시 */}
        <div className="bg-background-primary dark:bg-background-dark rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
          {/* 로딩 오버레이 */}
          <div className="absolute inset-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-sage-30 border-t-sage-70 mb-4"></div>
              <p className="text-sage-100 font-medium">
                프로필 정보를 불러오는 중...
              </p>
            </div>
          </div>

          {/* 기본 프로필 폼 구조 (로딩 중에도 표시) */}
          <div className="opacity-50">
            <h2 className="text-xl font-medium text-text-primary dark:text-text-dark mb-6">
              프로필 정보
            </h2>

            <div className="flex space-x-6">
              {/* 프로필 이미지 */}
              <div className="flex flex-col items-center min-w-[240px]">
                <div className="relative w-48 h-48 group">
                  <div className="w-full h-full bg-background-secondary dark:bg-background-dark-tertiary rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                    <span className="text-6xl" role="img" aria-label="카메라">
                      📷
                    </span>
                  </div>
                </div>
                {/* 프로필 이미지 업로드 힌트 */}
                <div className="mt-3 text-center">
                  <div className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    클릭하여 이미지 변경
                  </div>
                </div>
              </div>

              {/* 프로필 정보 입력 */}
              <div className="flex-1 space-y-6">
                <div>
                  <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                    닉네임
                  </div>
                  <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
                </div>

                <div>
                  <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                    이메일
                  </div>
                  <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
                </div>

                <div>
                  <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                    생년월일
                  </div>
                  <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
                </div>

                <div>
                  <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                    성별
                  </div>
                  <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
                </div>
              </div>
            </div>

            {/* 프로필 업데이트 버튼 */}
            <div className="mt-8 pt-6 border-t border-border-subtle dark:border-border-dark flex justify-center">
              <div className="h-12 w-32 bg-gray-100 dark:bg-background-dark-secondary rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* 보안 설정 섹션 */}
        <div className="bg-background-primary dark:bg-background-dark rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
          <h2 className="text-xl font-medium text-text-primary dark:text-text-dark mb-6">
            보안 설정
          </h2>
          <div className="space-y-6">
            <div>
              <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                현재 비밀번호
              </div>
              <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
            </div>
            <div>
              <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                새 비밀번호
              </div>
              <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
            </div>
            <div>
              <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                새 비밀번호 확인
              </div>
              <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
            </div>
          </div>
        </div>

        {/* 계정 설정 섹션 */}
        <div className="bg-background-primary dark:bg-background-dark rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
          <h2 className="text-xl font-medium text-text-primary dark:text-text-dark mb-6">
            계정 설정
          </h2>
          <div className="space-y-6">
            <div>
              <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                알림 설정
              </div>
              <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
            </div>
            <div>
              <div className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2">
                개인정보 설정
              </div>
              <div className="h-12 bg-gray-100 dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark"></div>
            </div>
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
                    handleProfileImageUpload(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="profile-upload"
                className="cursor-pointer block w-full h-full"
              >
                <div className="w-full h-full bg-background-secondary dark:bg-background-dark-tertiary rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                  {profileData.profileImage || authUser?.profileImage ? (
                    <Image
                      src={
                        profileData.profileImage || authUser?.profileImage || ''
                      }
                      alt="프로필 이미지"
                      className="w-full h-full object-cover"
                      width={192}
                      height={192}
                      unoptimized={(
                        profileData.profileImage ||
                        authUser?.profileImage ||
                        ''
                      ).startsWith('data:')}
                    />
                  ) : (
                    <span className="text-6xl" role="img" aria-label="카메라">
                      📷
                    </span>
                  )}

                  {/* 업로드 중 표시 */}
                  {isImageUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                      <div className="text-white text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mb-2"></div>
                        <p className="text-sm">업로드 중...</p>
                      </div>
                    </div>
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
                <FormInput
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={profileData.nickname}
                  onChange={handleInputChange}
                  maxLength={10}
                  className="flex-1"
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
                로그인 및 알림에 사용되는 이메일입니다. (보안상 일부가
                마스킹됩니다)
                {profileData.accountType === 'social' && (
                  <span className="block mt-1 text-orange-600 dark:text-orange-400">
                    ⚠️ 소셜 계정은 이메일 변경이 불가능합니다.{' '}
                    {profileData.provider}에서 직접 변경해주세요.
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={maskEmail(profileData.email)}
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
          <div className="text-center">
            <button
              onClick={handleProfileUpdate}
              className="saegim-button saegim-button-medium"
              disabled={isUpdating || profileData.nickname === originalNickname}
            >
              {isUpdating ? '업데이트 중...' : '프로필 업데이트'}
            </button>
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2">
              프로필 이미지는 업로드 시 자동으로 저장됩니다. 이 버튼은 닉네임
              변경 시에만 사용됩니다.
            </p>
          </div>
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
              ⚠️ 소셜 계정은 비밀번호 변경이 불가능합니다.{' '}
              {profileData.provider}에서 직접 관리해주세요.
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
          {profileData.accountType === 'email'
            ? '계정을 탈퇴하면 모든 데이터가 30일간 보관 후 영구적으로 삭제됩니다.'
            : '소셜 계정 탈퇴 시 모든 데이터가 30일간 보관 후 영구적으로 삭제됩니다.'}
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleAccountDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {profileData.accountType === 'email'
              ? '계정 탈퇴 (비밀번호 필요)'
              : '계정 탈퇴'}
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
        message={
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              정말로 계정을 탈퇴하시겠습니까?
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">
                탈퇴 안내 사항
              </h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {profileData.accountType === 'email' ? (
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>비밀번호 확인이 완료되었습니다</span>
                  </li>
                ) : (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                      •
                    </span>
                    <span>소셜 계정 탈퇴는 즉시 처리됩니다</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                    •
                  </span>
                  <span>계정과 모든 데이터가 30일간 보관됩니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                    •
                  </span>
                  <span>30일 이내에 복구할 수 있습니다</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 text-sm mt-0.5">
                  ⚠️
                </span>
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                  30일 경과 후 모든 데이터가 영구적으로 삭제됩니다
                </span>
              </div>
            </div>
          </div>
        }
        confirmText="예, 탈퇴하겠습니다"
        cancelText="아니오"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* 비밀번호 입력 모달 (이메일 계정용) */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-gray-500/20 dark:bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark mb-2">
                🔐 계정 탈퇴 확인
              </h2>
              <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
                이메일 계정 탈퇴를 위해 비밀번호를 입력해주세요.
              </p>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                탈퇴 후 30일 이내에 복구할 수 있습니다.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="withdraw-password"
                  className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                >
                  비밀번호
                </label>
                <FormInput
                  type="password"
                  id="withdraw-password"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setWithdrawPassword('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handlePasswordConfirm}
                  disabled={!withdrawPassword.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이메일 변경 모달 */}
      {isEmailChangeModalOpen && (
        <div className="fixed inset-0 bg-gray-500/20 dark:bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark mb-2">
                🔐 이메일 변경 확인
              </h2>
              <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
                <span className="font-medium">변경할 이메일:</span>{' '}
                <span className="font-medium text-green-600">
                  {emailChangeData.email}
                </span>
              </p>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                위 이메일로 변경됩니다. 보안을 위해 현재 비밀번호를
                입력해주세요.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailChangeModalSubmit();
              }}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                >
                  현재 비밀번호
                </label>
                <FormInput
                  type="password"
                  id="password"
                  value={emailChangeData.password}
                  onChange={(e) =>
                    setEmailChangeData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
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
        <div className="fixed inset-0 bg-gray-500/20 dark:bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark mb-2">
                {nicknameCheckResult.available
                  ? '✅ 사용 가능'
                  : '❌ 사용 불가'}
              </h2>
              <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
                <span className="font-medium">확인한 닉네임:</span>{' '}
                <span
                  className={`font-medium ${nicknameCheckResult.available ? 'text-green-600' : 'text-red-600'}`}
                >
                  {nicknameCheckResult.nickname}
                </span>
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
                      title: '알림',
                      description:
                        '닉네임이 사용 가능합니다. 프로필 업데이트 버튼을 눌러주세요.',
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
