/**
 * 표준화된 에러 핸들링 유틸리티
 */

import { toast } from '@/hooks/use-toast';
import { getLogger } from '@/lib/logger';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  toastTitle?: string;
  toastDescription?: string;
  logLevel?: 'error' | 'warn' | 'info';
}

/**
 * API 에러를 표준화된 형식으로 변환
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    return {
      message:
        (typeof errorObj.message === 'string' ? errorObj.message : null) ||
        (typeof errorObj.error === 'string' ? errorObj.error : null) ||
        '알 수 없는 오류가 발생했습니다',
      code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
      status:
        (typeof errorObj.status === 'number' ? errorObj.status : null) ||
        (typeof errorObj.statusCode === 'number'
          ? errorObj.statusCode
          : null) ||
        undefined,
      details: errorObj,
    };
  }

  return {
    message: '알 수 없는 오류가 발생했습니다',
    details: error,
  };
}

/**
 * 표준화된 에러 핸들러
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {},
): ApiError {
  const {
    context = 'Unknown',
    showToast = true,
    toastTitle = '오류',
    toastDescription,
    logLevel = 'error',
  } = options;

  const normalizedError = normalizeError(error);
  const logger = getLogger(context);

  // 로깅
  switch (logLevel) {
    case 'error':
      logger.error(normalizedError.message, { error: normalizedError });
      break;
    case 'warn':
      logger.warn(normalizedError.message, { error: normalizedError });
      break;
    case 'info':
      logger.info(normalizedError.message, { error: normalizedError });
      break;
  }

  // 토스트 표시
  if (showToast) {
    toast({
      title: toastTitle,
      description: toastDescription || normalizedError.message,
      variant: 'destructive',
    });
  }

  return normalizedError;
}

/**
 * API 호출을 위한 표준화된 try-catch 래퍼
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions = {},
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, options);
    return null;
  }
}

/**
 * 공통 에러 메시지 상수
 */
export const ERROR_MESSAGES = {
  NETWORK: '네트워크 연결을 확인해주세요',
  AUTH: '인증이 만료되었습니다. 다시 로그인해주세요',
  VALIDATION: '입력값을 확인해주세요',
  NOT_FOUND: '요청한 데이터를 찾을 수 없습니다',
  SERVER: '서버에 일시적인 문제가 발생했습니다',
  UNKNOWN: '알 수 없는 오류가 발생했습니다',
} as const;

/**
 * HTTP 상태 코드별 에러 메시지 매핑
 */
export function getErrorMessageByStatus(status: number): string {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION;
    case 401:
    case 403:
      return ERROR_MESSAGES.AUTH;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.SERVER;
    default:
      return ERROR_MESSAGES.UNKNOWN;
  }
}
