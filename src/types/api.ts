/**
 * API 관련 공통 타입 정의
 */

import type { LanguageCode } from './language';

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

/**
 * 인증 관련 API 응답 타입 정의
 */

export interface UserProfileResponse {
  nickname: string;
  email: string;
  user_id: string;
  account_type: string;
  provider?: string;
  is_active: boolean;
  profile_image?: string;
  preferred_language?: LanguageCode | null;
}

export interface AuthUserResponse {
  user_id: string;
  email: string;
  nickname?: string;
  account_type?: string;
  profile_image?: string;
  provider?: string;
  preferred_language?: LanguageCode | null;
}

export interface UserSettingsResponse {
  user_id: string;
  preferred_language: LanguageCode;
  updated_at: string;
}

export interface EmailTokenVerificationResponse {
  valid: string;
  email?: string;
}

export interface EmailChangeResponse {
  requires_logout: string;
}

export interface NicknameCheckResponse {
  available: boolean;
  message: string;
}

export interface NicknameAvailabilityResponse {
  available: boolean;
}

/**
 * 알림 관련 API 응답 타입 정의
 */

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  status: 'sent' | 'failed' | 'pending' | 'delivered' | 'opened';
  created_at: string;
  fcm_response?: Record<string, unknown>;
  isRead?: boolean;
  actionUrl?: string;
}

export interface ProfileImageUploadResponse {
  success: boolean;
  profile_image_url: string;
  message: string;
}
