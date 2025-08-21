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

export interface LoginResponse {
  user_id: string;
  email: string;
  nickname: string;
  message: string;
  access_token: string;
  refresh_token: string;
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

    // JWT 토큰 가져오기 (localStorage)
    const token = localStorage.getItem('access_token');
    
    console.log('🌐 ApiClient: 요청 시작', {
      url,
      method: options.method || 'GET',
      hasAuthHeader: !!options.headers && 'Authorization' in options.headers,
      hasToken: !!token,
    });
    
    const defaultOptions: RequestInit = {
      credentials: 'include', // 모든 API 호출에 쿠키 포함 (Google OAuth용)
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
        'Accept-Charset': 'utf-8',
        ...(token && { 'Authorization': `Bearer ${token}` }), // Bearer 토큰 포함 (이메일 로그인용)
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      console.log('📡 ApiClient: 응답 받음', {
        status: response.status,
        ok: response.ok,
        url: response.url,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('📊 ApiClient: 응답 데이터', {
        hasData: !!data,
        dataType: typeof data,
        success: data?.success,
      });

      return data;
    } catch (error) {
      console.error('❌ ApiClient: 요청 실패', error);
      throw error;
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
      
      // 클라이언트 측 토큰 정리
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      return { success: true };
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // API 호출이 실패해도 클라이언트 상태는 정리
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
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
  login: async (data: {
    email: string;
    password: string;
  }) => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', data);
    
    // JWT 토큰 저장
    if (response.data && response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
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
};

// 다이어리 API 엔드포인트
export const diaryApi = {
  // 다이어리 목록 조회
  getDiaries: (params?: {
    page?: number;
    page_size?: number;
    emotion?: string;
    is_public?: boolean;
    start_date?: string;
    end_date?: string;
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

  // 캘린더용 다이어리 조회
  getCalendarDiaries: (userId: string, startDate: string, endDate: string) =>
    apiClient.get(`/api/diary/calendar/${userId}`, {
      start_date: startDate,
      end_date: endDate,
    }),
};
