/**
 * API 클라이언트 설정
 */

import { DiaryListEntry } from '@/types/diary';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
  request_id: string;
}

export interface PasswordResetEmailResponse {
  success: boolean;
  message: string;
  is_social_account?: boolean;
  email_sent?: boolean;
  redirect_to_error_page?: boolean;
}

export interface LoginResponse {
  user_id: string;
  email: string;
  nickname: string;
  message: string;
  // 쿠키 기반 인증이므로 토큰은 응답에 포함되지 않음
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

    console.log('🌐 ApiClient: 요청 시작', {
      url,
      method: options.method || 'GET',
      hasAuthHeader: !!options.headers && 'Authorization' in options.headers,
    });

    const defaultOptions: RequestInit = {
      credentials: 'include', // 모든 API 호출에 쿠키 포함 (통일된 인증 방식)
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json; charset=utf-8',
        'Accept-Charset': 'utf-8',
        ...options.headers,
      },
      ...options,
    };

    try {
      // 타임아웃 설정 (10초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📡 ApiClient: 응답 받음', {
        status: response.status,
        ok: response.ok,
        url: response.url,
      });

      // 401 에러 시 토큰 갱신 시도 (쿠키 기반)
      if (response.status === 401) {
        console.log('🔄 토큰 만료, 갱신 시도...');
        const refreshed = await this.refreshToken();
        
        if (refreshed) {
          // 새로운 토큰으로 재시도 (쿠키가 자동으로 전송됨)
          const retryResponse = await fetch(url, defaultOptions);
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          const retryData = await retryResponse.json();
          return retryData;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        // 에러 응답을 포함한 에러 객체 생성
        const error = new Error(`HTTP error! status: ${response.status}`);
        (error as any).response = { data, status: response.status };
        throw error;
      }

      console.log('📊 ApiClient: 응답 데이터', {
        hasData: !!data,
        dataType: typeof data,
        success: data?.success,
      });

      return data;
    } catch (error: unknown) {
      console.error('❌ ApiClient: 요청 실패', error);
      
      // 타임아웃 에러 처리
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      }
      
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      // 토큰 갱신에도 타임아웃 설정 (5초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 쿠키에서 refresh_token 자동 전송
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ 토큰 갱신 성공');
        return true;
      } else {
        console.log('❌ 토큰 갱신 실패');
        // 갱신 실패 시 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return false;
      }
    } catch (error) {
      console.error('❌ 토큰 갱신 중 오류:', error);
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

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);

// 인증 관련 API 엔드포인트
export const authApi = {
  // 구글 로그인 시작 (백엔드로 리다이렉트)
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  },

  // 로그아웃
  logout: async () => {
    try {
      // 백엔드에 로그아웃 요청 (쿠키 기반 세션 정리)
      await apiClient.post('/api/auth/logout', {});

      // 쿠키가 자동으로 삭제되므로 localStorage 정리 불필요
      return { success: true };
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // API 호출이 실패해도 쿠키는 자동으로 정리됨
      return { success: true };
    }
  },

  // 회원가입
  signup: async (data: {
    email: string;
    password: string;
    nickname: string;
  }) => {
    return apiClient.post('/api/auth/signup', data);
  },

  // 이메일 중복 확인
  checkEmail: async (email: string) => {
    return apiClient.get(`/api/auth/check-email/${email}`);
  },

  // 닉네임 중복 확인
  checkNickname: async (nickname: string) => {
    return apiClient.get(`/api/auth/check-nickname/${nickname}`);
  },

  // 이메일 로그인
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      data,
    );

    // 쿠키에 토큰이 자동으로 설정되므로 localStorage 저장 불필요
    return response;
  },

  // 이메일 인증 코드 발송
  sendVerificationEmail: async (data: { email: string }) => {
    return apiClient.post('/api/auth/send-verification-email', data);
  },

  // 이메일 인증 코드 확인
  verifyEmail: async (data: { email: string; verification_code: string }) => {
    return apiClient.post('/api/auth/verify-email', data);
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    return apiClient.get('/api/auth/me');
  },

  // 비밀번호 재설정 이메일 발송
  sendPasswordResetEmail: async (data: { email: string }) => {
    return apiClient.post<PasswordResetEmailResponse>('/api/auth/forgot-password', data);
  },

  // 비밀번호 재설정 인증코드 확인
  verifyPasswordResetCode: async (data: { 
    email: string; 
    verification_code: string 
  }) => {
    return apiClient.post('/api/auth/forgot-password/verify', data);
  },

  // 비밀번호 재설정
  resetPassword: async (data: { 
    email: string; 
    verification_code: string; 
    new_password: string 
  }) => {
    return apiClient.post('/api/auth/forgot-password/reset', data);
  },
};

// 다이어리 API 엔드포인트
export const diaryApi = {
  // 다이어리 목록 조회
  getDiaries: (params?: {
    page?: number;
    page_size?: number;
    emotion?: string;
    start_date?: string;
    end_date?: string;
    sort_order?: string;
  }) => {
    const stringParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          stringParams[key] = String(value);
        }
      });
    }
    return apiClient.get<DiaryListEntry[]>('/api/diary/', stringParams);
  },

  // 특정 다이어리 조회
  getDiary: (id: string) => apiClient.get(`/api/diary/${id}`),

  // 다이어리 수정
  updateDiary: (
    id: string,
    data: {
      title?: string;
      content?: string;
      user_emotion?: string;
      is_public?: boolean;
      keywords?: string[];
    },
  ) => apiClient.put(`/api/diary/${id}`, data),

  // 캘린더용 다이어리 조회 (JWT 기반, user_id 파라미터 제거)
  getCalendarDiaries: (startDate: string, endDate: string) =>
    apiClient.get('/api/diary/calendar', {
      start_date: startDate,
      end_date: endDate,
    }),
};
