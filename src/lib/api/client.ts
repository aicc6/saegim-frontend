/**
 * 중앙화된 API 클라이언트
 * 모든 API 호출의 기반이 되는 핵심 클라이언트
 */

import { TIMEOUTS } from '@/constants/timeouts';
import { CONTENT_TYPES, ACCEPT_TYPES } from '@/constants/locale';
import { getLogger } from '../logger';

// HTTPS 강제 - 보안상 HTTP 프로토콜 사용 금지
const ensureHttps = (url: string): string => {
  // localhost는 항상 HTTP 허용 (개발환경)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url;
  }
  // 프로덕션에서는 HTTP를 HTTPS로 강제 변환
  return url.replace(/^http:/, 'https:');
};

const logger = getLogger('api-client');

// 환경변수 검증 - 개발/배포 환경 모두 지원
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    // 개발 환경에서는 localhost 사용, 배포 환경에서는 경고
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        'NEXT_PUBLIC_API_BASE_URL이 설정되지 않아 localhost:8000을 사용합니다.',
      );
      return 'http://localhost:8000';
    } else {
      logger.error('NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.');
      throw new Error(
        'NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.',
      );
    }
  }

  return apiUrl;
};

export const API_BASE_URL = ensureHttps(getApiBaseUrl());

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
  request_id: string;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    logger.debug('🌐 ApiClient: 요청 시작', {
      url,
      method: options.method || 'GET',
      hasAuthHeader: !!options.headers && 'Authorization' in options.headers,
    });

    const defaultOptions: RequestInit = {
      credentials: 'include', // 모든 API 호출에 쿠키 포함 (통일된 인증 방식)
      headers: {
        'Content-Type': CONTENT_TYPES.JSON_UTF8,
        Accept: ACCEPT_TYPES.JSON_UTF8,
        'Accept-Charset': 'utf-8',
        ...options.headers,
      },
      ...options,
    };

    try {
      // 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        TIMEOUTS.API_DEFAULT,
      );

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      logger.debug('📡 ApiClient: 응답 받음', {
        status: response.status,
        ok: response.ok,
        url: response.url,
      });

      // 401 에러 시 토큰 갱신 시도 (쿠키 기반) - 로그인 요청 제외
      if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
        logger.info('🔄 토큰 만료, 갱신 시도...');
        const refreshed = await this.refreshToken();

        if (refreshed) {
          // 새로운 토큰으로 재시도 (쿠키가 자동으로 전송됨)
          const retryResponse = await fetch(url, defaultOptions);

          if (!retryResponse.ok) {
            // 재시도도 실패하면 토큰 갱신이 무효화된 것으로 간주
            logger.warn(
              '❌ 토큰 갱신 후 재시도 실패, 랜딩 페이지로 리다이렉트',
            );
            if (typeof window !== 'undefined') {
              // 탈퇴 관련 요청인지 확인하여 적절한 상태로 리다이렉트
              const isWithdrawRequest = endpoint.includes('/api/auth/withdraw');
              // 탈퇴 요청의 경우 랜딩 페이지로 리다이렉트하지 않음 (프론트엔드에서 처리)
              if (!isWithdrawRequest) {
                window.location.href = '/landing?status=token_expired';
              }
            }
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          const retryData = await retryResponse.json();
          return retryData;
        }
      }

      // 일부 엔드포인트는 204 No Content 또는 빈 본문을 반환할 수 있음
      let data: ApiResponse<T> | null = null;
      let parseError: unknown = null;
      try {
        // 콘텐츠가 없더라도 json() 시도. 실패하면 아래에서 보정
        data = (await response.json()) as ApiResponse<T>;
      } catch (e) {
        parseError = e;
      }

      if (!response.ok) {
        // 에러 응답을 포함한 에러 객체 생성
        const error = new Error(
          `HTTP error! status: ${response.status}`,
        ) as Error & {
          response?: { data: unknown; status: number };
        };
        error.response = { data, status: response.status };
        throw error;
      }

      // 성공이지만 본문 파싱 실패 또는 본문이 비어있는 경우 성공으로 취급 (예: 204)
      if ((response.status === 204 || data == null) && parseError) {
        logger.debug('📊 ApiClient: 본문 없음(204/empty), 성공 처리');
        const fallback: ApiResponse<T> = {
          success: true,
          // 빈 응답의 경우 data는 null로 반환
          data: null as unknown as T,
          message: null,
          timestamp: new Date().toISOString(),
          request_id: '',
        };
        return fallback;
      }

      logger.debug('📊 ApiClient: 응답 데이터', {
        hasData: !!data,
        dataType: typeof data,
        success: data?.success,
      });

      return data as ApiResponse<T>;
    } catch (error: unknown) {
      logger.error('❌ ApiClient: 요청 실패', error);

      // 타임아웃 에러 처리
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      // 토큰 갱신에도 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        TIMEOUTS.API_UPLOAD,
      );

      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 쿠키에서 refresh_token 자동 전송
        headers: {
          'Content-Type': CONTENT_TYPES.JSON,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logger.info('✅ 토큰 갱신 성공');
        return true;
      } else {
        logger.warn('❌ 토큰 갱신 실패');
        // 갱신 실패 시 랜딩 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/landing?status=token_expired';
        }
        return false;
      }
    } catch (error) {
      logger.error('❌ 토큰 갱신 중 오류:', error);
      return false;
    }
  }

  // GET 요청
  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params)}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  // POST 요청
  async post<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT 요청
  async put<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH 요청
  async patch<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // FormData 업로드를 위한 특별한 메소드
  async upload<T>(
    endpoint: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    logger.debug('📤 ApiClient: 파일 업로드 시작', { endpoint });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        TIMEOUTS.API_UPLOAD,
      );

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // FormData의 경우 Content-Type을 설정하지 않음 (브라우저가 자동 설정)
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.debug('✅ ApiClient: 파일 업로드 성공', { data });

      // 백엔드에서 이미 BaseResponse 형식으로 응답하므로 그대로 반환
      return data;
    } catch (error) {
      logger.error('❌ ApiClient: 파일 업로드 실패', error);
      throw error;
    }
  }

  // 스트리밍을 위한 특별한 메소드
  async stream(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;

    logger.debug('🌊 ApiClient: 스트리밍 요청 시작', { endpoint });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': CONTENT_TYPES.JSON_UTF8,
          Accept: ACCEPT_TYPES.JSON_UTF8,
          'Accept-Charset': 'utf-8',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      logger.debug('🌊 ApiClient: 스트리밍 응답 받음', {
        status: response.status,
        ok: response.ok,
      });

      return response;
    } catch (error) {
      logger.error('❌ ApiClient: 스트리밍 요청 실패', error);
      throw error;
    }
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);
