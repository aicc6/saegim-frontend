'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleLoginButton from '@/components/ui/custom/GoogleLoginButton';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // URL 파라미터로 전달된 에러 처리
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error && message) {
      let errorTitle = '로그인 실패';
      let errorDescription = message;
      
      if (error === 'account_permanently_deleted') {
        errorTitle = '영구 삭제된 계정';
        errorDescription = '탈퇴 후 30일이 경과되어 복구할 수 없습니다.';
      } else if (error === 'account_deleted') {
        errorTitle = '탈퇴된 계정';
        errorDescription = '탈퇴된 계정입니다. 복구 페이지에서 계정을 복구할 수 있습니다.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 데모 계정 정보
  const DEMO_ACCOUNT = {
    email: 'demo@saegim.com',
    password: 'saegim2024',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 데모 계정 로그인 체크 (쿠키 기반 인증으로 변경)
    if (
      formData.email === DEMO_ACCOUNT.email &&
      formData.password === DEMO_ACCOUNT.password
    ) {
      // 데모 계정도 실제 API를 통해 로그인 처리
      console.log('🔍 데모 계정 로그인 시도');
    }
    
    setIsLoading(true);
    
    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      });
      
      // 로그인 성공 시 사용자 정보를 스토어에 저장
      const userData = (response.data as any);
      login({
        id: userData.user_id,
        email: userData.email,
        name: userData.nickname, // 백엔드에서는 nickname, 프론트엔드에서는 name
        profileImage: '',
        provider: 'email',
        createdAt: new Date().toISOString(),
      });
      
      toast({
        title: '로그인 성공',
        description: '새김에 오신 것을 환영합니다!',
        variant: 'default',
      });
      
      router.push('/');
      
    } catch (error: any) {
      console.error('로그인 실패:', error);
      console.error('에러 상세 정보:', {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      });
      
      // 상세한 에러 메시지 처리
      let errorTitle = '로그인 실패';
      let errorDescription = '로그인 중 오류가 발생했습니다.';
      
      if (error.message) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          errorTitle = '인증 실패';
          errorDescription = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (errorMessage.includes('password')) {
          errorTitle = '비밀번호 오류';
          errorDescription = '비밀번호가 변경되었을 수 있습니다. 비밀번호 찾기를 이용해주세요.';
        } else if (errorMessage.includes('email') || errorMessage.includes('user')) {
          errorTitle = '계정 오류';
          errorDescription = '존재하지 않는 이메일 주소입니다. 회원가입을 먼저 진행해주세요.';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorTitle = '네트워크 오류';
          errorDescription = '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
        } else if (errorMessage.includes('timeout')) {
          errorTitle = '시간 초과';
          errorDescription = '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        }
      }
      
      // 백엔드에서 전달된 상세 에러 메시지가 있으면 우선 사용
      if (error.response?.data?.detail) {
        const backendError = error.response.data.detail;
        
        // 탈퇴된 계정 처리
        if (error.response?.status === 403 && typeof backendError === 'object') {
          if (backendError.error === 'ACCOUNT_DELETED' && backendError.restore_available) {
            errorTitle = '탈퇴된 계정';
            errorDescription = `탈퇴된 계정입니다. ${backendError.days_remaining}일 이내에 복구할 수 있습니다.`;
            
            // 복구 가능한 경우 복구 페이지로 이동 옵션 제공
            toast({
              title: errorTitle,
              description: errorDescription,
              variant: 'destructive',
              action: (
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() => router.push('/restore-account')}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    계정 복구하기
                  </button>
                </div>
              ),
            });
            return; // 다른 에러 처리 중단
          } else if (backendError.error === 'ACCOUNT_PERMANENTLY_DELETED') {
            errorTitle = '영구 삭제된 계정';
            errorDescription = '탈퇴 후 30일이 경과되어 복구할 수 없습니다.';
          }
        }
        
        // 비밀번호 변경 관련 특별 처리
        if (backendError.includes('비밀번호') || backendError.includes('password')) {
          errorTitle = '비밀번호 변경됨';
          errorDescription = '비밀번호가 변경되었습니다. 비밀번호 찾기를 이용해 새로운 비밀번호를 설정해주세요.';
        } else if (typeof backendError === 'string') {
          errorDescription = backendError;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // 구글 로그인 시작
    authApi.googleLogin();
  };

  const handleFindPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 로그인 안내 멘트 */}
      <div className="mt-8 text-center">
        <h2
          className="text-3xl font-serif mb-5 tracking-tight"
          style={{ color: '#5C8D89' }}
        >
          새김에 오신 것을 환영합니다
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
        {/* 아이디(메일계정) 입력 */}
        <div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
            placeholder="아이디(메일계정) 입력"
            required
            aria-describedby="email-help"
          />
          <p id="email-help" className="sr-only">
            이메일 주소를 입력해주세요
          </p>
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus bg-gray-50 dark:bg-background-dark-tertiary text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200 text-base font-light tracking-wide"
            placeholder="비밀번호 입력"
            required
            aria-describedby="password-help"
          />
          <p id="password-help" className="sr-only">
            비밀번호를 입력해주세요
          </p>
        </div>

        {/* 로그인하기 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full saegim-button saegim-button-large disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '로그인 중...' : '로그인하기'}
        </button>

        {/* 구글 로그인 버튼 */}
        <GoogleLoginButton onClick={handleGoogleLogin} />

        {/* 비밀번호 찾기 */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={handleFindPassword}
            className="text-gray-600 dark:text-text-dark-primary hover:text-sage-50 dark:hover:text-text-dark-inverse font-light text-sm tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary rounded-lg px-3 py-1 hover:bg-gray-100 dark:hover:bg-background-dark-hover"
            aria-label="비밀번호 찾기"
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 데모 계정 안내 */}
        <div className="text-center mt-6 p-4 bg-gray-50 dark:bg-background-dark-tertiary rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
            데모 계정으로 체험해보세요
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
            demo@saegim.com / saegim2024
          </p>
        </div>
      </form>
    </div>
  );
}
