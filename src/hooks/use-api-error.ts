import { useRouter } from 'next/navigation';
import { UseFormSetError, FieldValues, Path } from 'react-hook-form';

import { useToast } from '@/hooks/use-toast';
import { getLogger } from '@/lib/logger';
import type { ApiError } from '@/types/api';
import { parse422Error, is422Error } from '@/utils/form-error-handler';

interface UseApiErrorOptions {
  /** 로거 이름 (컴포넌트명) */
  loggerName: string;
  /** 소셜 계정 감지 시 리다이렉트할 경로 */
  socialAccountRedirectPath?: string;
  /** 토큰 만료 시 리다이렉트할 경로 */
  tokenExpiredRedirectPath?: string;
}

export function useApiError(options: UseApiErrorOptions) {
  const { toast } = useToast();
  const router = useRouter();
  const logger = getLogger(options.loggerName);

  const handleApiError = <T extends FieldValues = FieldValues>(
    error: unknown,
    defaultTitle: string = '오류',
    defaultMessage?: string,
    setError?: UseFormSetError<T>,
  ) => {
    const apiError = error as ApiError;
    const errorDetail = apiError.response?.data?.detail;
    const errorMessage =
      errorDetail ||
      apiError.message ||
      defaultMessage ||
      '알 수 없는 오류가 발생했습니다.';

    logger.error(`${defaultTitle} 발생`, { error });

    // 422 Unprocessable Entity 에러 처리 (서버 검증 실패)
    if (is422Error(error) && setError) {
      const validationErrors = parse422Error(error);

      if (validationErrors.length > 0) {
        logger.debug('422 에러를 필드별로 설정', validationErrors);

        // 각 검증 에러를 해당 필드에 설정
        validationErrors.forEach(({ field, message }) => {
          setError(field as Path<T>, {
            type: 'server',
            message,
          });
        });

        // 필드별 에러가 설정된 경우 토스트는 간단하게 표시
        toast({
          title: defaultTitle,
          description: '입력하신 정보를 확인해주세요.',
          variant: 'destructive',
        });
        return;
      }
    }

    // 소셜 계정 관련 에러 처리
    if (
      options.socialAccountRedirectPath &&
      isSocialAccountError(errorMessage)
    ) {
      logger.warn('소셜 계정 감지됨, 에러 페이지로 리다이렉트', {
        errorMessage,
      });
      router.push(options.socialAccountRedirectPath);
      return;
    }

    // 인증 에러 처리
    if (isAuthenticationError(apiError)) {
      const redirectPath =
        options.tokenExpiredRedirectPath || '/landing?status=token_expired';
      logger.warn('인증 오류 감지, 리다이렉트', { redirectPath });
      router.push(redirectPath);
      return;
    }

    // 일반 에러 토스트 표시
    toast({
      title: defaultTitle,
      description: errorMessage,
      variant: 'destructive',
    });
  };

  return {
    handleApiError,
    /**
     * 특정 에러 메시지에 대한 성공 토스트 표시
     */
    showSuccess: (title: string, description: string, duration?: number) => {
      toast({
        title,
        description,
        variant: 'default',
        duration,
      });
    },
  };
}

/**
 * 소셜 계정 관련 에러인지 확인
 */
function isSocialAccountError(errorMessage: string): boolean {
  const socialAccountIndicators = [
    '소셜 계정 사용자입니다',
    '소셜 계정',
    'social account',
    'Google',
    'Google 계정',
    '계정으로 가입된 사용자',
  ];

  return socialAccountIndicators.some((indicator) =>
    errorMessage.includes(indicator),
  );
}

/**
 * 인증 관련 에러인지 확인
 */
function isAuthenticationError(error: ApiError): boolean {
  return error.response?.status === 401;
}

/**
 * 특정 에러 타입별 사용자 친화적 메시지 반환
 */
export function getErrorMessage(error: ApiError, context?: string): string {
  const errorDetail = error.response?.data?.detail;

  if (!errorDetail) {
    return context
      ? `${context} 중 오류가 발생했습니다.`
      : '알 수 없는 오류가 발생했습니다.';
  }

  // 공통 에러 메시지 매핑
  const errorMap: Record<string, string> = {
    'Invalid credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'User not found': '존재하지 않는 사용자입니다.',
    'Email already exists': '이미 사용 중인 이메일입니다.',
    'Nickname already exists': '이미 사용 중인 닉네임입니다.',
    'Invalid verification code': '인증 코드가 올바르지 않습니다.',
    'Verification code expired': '인증 코드가 만료되었습니다.',
    'Password too weak': '비밀번호가 보안 요구사항을 충족하지 않습니다.',
    'Rate limit exceeded':
      '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  };

  return errorMap[errorDetail] || errorDetail;
}
