'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "오류",
        description: "이메일을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // 비밀번호 재설정 이메일 발송
      const response = await authApi.sendPasswordResetEmail({ email });
      
      // 소셜 계정 사용자인 경우 에러 페이지로 리다이렉트
      if (response.data.is_social_account) {
        toast({
          title: "📧 안내 이메일 발송 완료!",
          description: "소셜 계정 사용자에게 안내 이메일을 발송했습니다.",
          duration: 3000,
        });
        router.push('/error/reset-password');
        return;
      }
      
      toast({
        title: "📧 인증 이메일 발송 완료!",
        description: `${email}로 인증코드를 발송했습니다.\n\n이메일을 확인하여 인증코드를 입력해주세요.`,
        duration: 5000,
      });
      
      // 인증코드 입력 모달 열기
      setIsVerificationModalOpen(true);
      
    } catch (error: any) {
      console.error('비밀번호 재설정 이메일 발송 실패:', error);
      const errorMsg = error.response?.data?.detail || '이메일 발송에 실패했습니다.';
      
      console.log('에러 메시지:', errorMsg);
      console.log('에러 응답:', error.response?.data);
      
      // 소셜 계정 사용자인 경우 에러 페이지로 리다이렉트
      if (errorMsg.includes('소셜 계정 사용자입니다') || errorMsg.includes('소셜 계정') || errorMsg.includes('social account') || errorMsg.includes('Google') || errorMsg.includes('Google 계정') || errorMsg.includes('계정으로 가입된 사용자')) {
        console.log('소셜 계정 감지됨, 에러 페이지로 리다이렉트');
        console.log('감지된 에러 메시지:', errorMsg);
        router.push('/error/reset-password');
        return;
      }
      
      if (errorMsg.includes('존재하지 않는') || errorMsg.includes('가입되지 않은')) {
        toast({
          title: "계정 없음",
          description: "해당 이메일로 가입된 계정이 없습니다. 회원가입을 먼저 진행해주세요.",
          variant: "destructive",
        });
      } else if (errorMsg.includes('이메일 발송에 실패했습니다') || errorMsg.includes('이메일 발송 중 오류가 발생했습니다')) {
        toast({
          title: "이메일 발송 실패",
          description: "이메일 발송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "오류",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast({
        title: "오류",
        description: "6자리 인증코드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      
      // 인증코드 확인
      await authApi.verifyPasswordResetCode({ 
        email, 
        verification_code: verificationCode 
      });
      
      toast({
        title: "✅ 인증 완료!",
        description: "이메일 인증이 완료되었습니다. 새 비밀번호를 설정해주세요.",
      });
      
      // 인증코드 모달 닫고 비밀번호 재설정 모달 열기
      setIsVerificationModalOpen(false);
      setIsPasswordResetModalOpen(true);
      
    } catch (error: any) {
      console.error('인증코드 확인 실패:', error);
      const errorMsg = error.response?.data?.detail || '인증코드 확인에 실패했습니다.';
      toast({
        title: "오류",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "오류",
        description: "새 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    // 비밀번호 형식 검증 (영문, 숫자, 특수문자 포함 9자 이상)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        title: "오류",
        description: "비밀번호는 영문, 숫자, 특수문자를 포함하여 9자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResetting(true);
      
      // 비밀번호 재설정
      await authApi.resetPassword({
        email,
        verification_code: verificationCode,
        new_password: newPassword
      });
      
      toast({
        title: "🎉 비밀번호 변경 완료!",
        description: "비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.",
        duration: 5000,
      });
      
      // 모달 닫고 로그인 페이지로 이동
      setIsPasswordResetModalOpen(false);
      router.push('/login');
      
    } catch (error: any) {
      console.error('비밀번호 재설정 실패:', error);
      const errorMsg = error.response?.data?.detail || '비밀번호 재설정에 실패했습니다.';
      toast({
        title: "오류",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
            비밀번호 찾기
          </h1>
          <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
            이메일을 입력하시면 비밀번호 재설정 인증코드를 보내드립니다
          </p>
        </div>

        {/* 이메일 입력 */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
          />
        </div>

        {/* 재설정 이메일 보내기 버튼 */}
        <button
          onClick={handleSendResetEmail}
          disabled={isLoading}
          className="w-full saegim-button saegim-button-large"
        >
          {isLoading ? '발송 중...' : '재설정 이메일 보내기'}
        </button>

        {/* 로그인으로 돌아가기 버튼 */}
        <button
          onClick={handleGoToLogin}
          className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          로그인으로 돌아가기
        </button>

        {/* 회원가입하기 버튼 */}
        <button
          onClick={handleSignUp}
          className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          회원 가입하기
        </button>
      </div>

      {/* 인증코드 입력 모달 */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark mb-2">
                🔐 이메일 인증
              </h2>
              <p className="text-text-secondary dark:text-text-dark-secondary mb-2">
                <span className="font-medium">발송된 이메일:</span> <span className="font-medium text-green-600">{email}</span>
              </p>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                이메일로 발송된 6자리 인증코드를 입력해주세요.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                >
                  인증코드
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerificationModalOpen(false);
                    setVerificationCode('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="flex-1 saegim-button saegim-button-medium"
                >
                  {isVerifying ? '확인 중...' : '인증 확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 재설정 모달 */}
      {isPasswordResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark mb-2">
                🔑 새 비밀번호 설정
              </h2>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                새로운 비밀번호를 입력해주세요.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                >
                  새 비밀번호
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
                  placeholder="새 비밀번호 입력 (영문, 숫자, 특수문자 포함 9자 이상)"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                >
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
                  placeholder="새 비밀번호 다시 입력"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordResetModalOpen(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResetting || !newPassword || !confirmPassword}
                  className="flex-1 saegim-button saegim-button-medium"
                >
                  {isResetting ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}