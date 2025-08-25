'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    verificationCode: '',
  });

  const [emailVerified, setEmailVerified] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 닉네임 필드인 경우 실시간 검사 제거하고 모든 입력 허용
    if (name === 'nickname') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      // 중복 확인 상태 초기화 (닉네임이 변경되면 다시 확인 필요)
      if (nicknameChecked) {
        setNicknameChecked(false);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailVerified || !nicknameChecked) {
      toast({
        title: '입력 확인 필요',
        description: '이메일 인증과 닉네임 중복 확인을 완료해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 닉네임 유효성 검사 (한글과 영문만 허용)
    const koreanEnglishOnly = /^[가-힣a-zA-Z]+$/;
    if (!koreanEnglishOnly.test(formData.nickname)) {
      toast({
        title: '닉네임 형식 오류',
        description: '닉네임은 한글과 영문만 사용 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
      });

      toast({
        title: '회원가입 성공',
        description: '새김에 가입해주셔서 감사합니다!',
        variant: 'default',
      });

      // 로그인 페이지로 이동
      router.push('/login');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      toast({
        title: '회원가입 실패',
        description:
          error.response?.data?.detail || '회원가입 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      toast({
        title: '이메일 입력 필요',
        description: '이메일을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingCode(true);

    try {
      // 먼저 이메일 중복 확인
      const emailCheckResponse = await authApi.checkEmail(formData.email);

      if (!(emailCheckResponse.data as any).available) {
        toast({
          title: '이메일 중복',
          description: '이미 사용 중인 이메일입니다.',
          variant: 'destructive',
        });
        return;
      }

      // 인증 코드 발송
      await authApi.sendVerificationEmail({ email: formData.email });

      setCodeSent(true);
      toast({
        title: '인증 코드 발송',
        description: '이메일로 인증 코드가 발송되었습니다.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('인증 코드 발송 실패:', error);
      toast({
        title: '인증 코드 발송 실패',
        description:
          error.response?.data?.detail ||
          '인증 코드 발송 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      toast({
        title: '인증 코드 입력 필요',
        description: '인증 코드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.verificationCode.length !== 6) {
      toast({
        title: '인증 코드 형식 오류',
        description: '인증 코드는 6자리 숫자입니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifyingCode(true);

    try {
      await authApi.verifyEmail({
        email: formData.email,
        verification_code: formData.verificationCode,
      });

      setEmailVerified(true);
      toast({
        title: '이메일 인증 완료',
        description: '이메일 인증이 완료되었습니다.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('인증 코드 확인 실패:', error);
      toast({
        title: '인증 실패',
        description:
          error.response?.data?.detail || '인증 코드가 올바르지 않습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleNicknameCheck = async () => {
    if (!formData.nickname) {
      toast({
        title: '닉네임 입력 필요',
        description: '닉네임을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 닉네임 유효성 검사 (한글과 영문만 허용)
    const koreanEnglishOnly = /^[가-힣a-zA-Z]+$/;
    if (!koreanEnglishOnly.test(formData.nickname)) {
      toast({
        title: '닉네임 형식 오류',
        description: '닉네임은 한글과 영문만 사용 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await authApi.checkNickname(formData.nickname);

      if ((response.data as any).available) {
        setNicknameChecked(true);
        toast({
          title: '닉네임 확인 완료',
          description: '사용 가능한 닉네임입니다.',
          variant: 'default',
        });
      } else {
        toast({
          title: '닉네임 중복',
          description: '이미 사용 중인 닉네임입니다.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('닉네임 확인 실패:', error);
      toast({
        title: '닉네임 확인 실패',
        description: '닉네임 확인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
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
              onClick={handleSendVerificationCode}
              disabled={!formData.email || emailVerified || isSendingCode}
              className="px-4 py-3 text-white dark:text-text-dark-on-color rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
              style={{ backgroundColor: '#5C8D89' }}
            >
              {isSendingCode
                ? '발송중...'
                : emailVerified
                  ? '인증완료'
                  : '인증'}
            </button>
          </div>
        </div>

        {/* 이메일 인증 코드 입력 */}
        {codeSent && !emailVerified && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
                placeholder="인증 코드 6자리 입력"
                maxLength={6}
                disabled={isVerifyingCode}
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={
                  !formData.verificationCode ||
                  formData.verificationCode.length !== 6 ||
                  isVerifyingCode
                }
                className="px-4 py-3 text-white dark:text-text-dark-on-color rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
                style={{ backgroundColor: '#5C8D89' }}
              >
                {isVerifyingCode ? '확인중...' : '확인'}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-text-dark-secondary">
              이메일로 발송된 6자리 인증 코드를 입력해주세요.
            </p>
          </div>
        )}

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
              maxLength={10}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
              placeholder="닉네임 입력 (2-10자, 한글/영문만)"
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
          disabled={!isFormValid() || isLoading}
          className="w-full text-white dark:text-text-dark-on-color py-3 px-4 rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base tracking-wide shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
          style={{ backgroundColor: '#5C8D89' }}
        >
          {isLoading ? '회원가입 중...' : '회원가입하기'}
        </button>
      </form>
    </div>
  );
}
