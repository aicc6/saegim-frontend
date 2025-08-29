/**
 * API 관련 공통 타입 정의
 */

export interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      [key: string]: unknown;
    };
    status?: number;
  };
  message?: string;
  [key: string]: unknown;
}

export interface BaseApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
  request_id: string;
}

export interface ValidationErrorResponse {
  detail: string;
  validation_errors?: Record<string, string[]>;
}
