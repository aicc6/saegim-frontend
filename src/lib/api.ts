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
      headers: options.headers,
    });

    const defaultOptions: RequestInit = {
      credentials: 'include', // 모든 API 호출에 쿠키 포함
      headers: {
        'Content-Type': 'application/json',
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
        data,
        dataType: typeof data,
        hasData: !!data,
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
      return { success: true };
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // API 호출이 실패해도 클라이언트 상태는 정리
      return { success: true };
    }
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

  // 캘린더용 다이어리 조회
  getCalendarDiaries: (userId: string, startDate: string, endDate: string) =>
    apiClient.get(`/api/diary/calendar/${userId}`, {
      start_date: startDate,
      end_date: endDate,
    }),
};
