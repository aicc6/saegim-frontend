/**
 * 알림 관련 API
 */

import { VALIDATION } from '@/constants/timeouts';
import { apiClient } from './client';

export interface FCMTokenRegisterRequest {
  token: string;
  device_type: 'web' | 'mobile';
  device_info?: {
    userAgent?: string;
    platform?: string;
    [key: string]: unknown;
  };
}

export interface FCMTokenResponse {
  id: string;
  token: string;
  device_type: 'web' | 'mobile';
  device_info?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettingsUpdate {
  push_enabled?: boolean;
  diary_reminder_enabled?: boolean;
  diary_reminder_time?: string | null; // HH:MM 형식
  diary_reminder_days?: string[] | null; // ['monday', 'tuesday', ...] 형식
  report_notification_enabled?: boolean;
  ai_processing_enabled?: boolean;
  browser_push_enabled?: boolean;
}

export interface NotificationSettingsResponse {
  id: string;
  user_id: string;
  push_enabled: boolean;
  diary_reminder_enabled: boolean;
  diary_reminder_time: string | null;
  diary_reminder_days: string[] | null;
  report_notification_enabled: boolean;
  ai_processing_enabled: boolean;
  browser_push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSendRequest {
  user_ids: string[];
  title: string;
  body: string;
  notification_type:
    | 'diary_reminder'
    | 'ai_content_ready'
    | 'weekly_report'
    | 'marketing'
    | 'general';
  data?: Record<string, unknown>;
}

export interface NotificationSendResponse {
  success_count: number;
  failure_count: number;
  successful_tokens: string[];
  failed_tokens: string[];
  message: string;
}

export interface NotificationHistoryResponse {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  status: 'sent' | 'failed' | 'pending';
  created_at: string;
  fcm_response?: Record<string, unknown>;
}

// 알림 관련 API 엔드포인트
export const notificationApi = {
  // 헬스 체크 (메인 헬스 체크 엔드포인트 사용)
  checkHealth: () => {
    return apiClient.get<{ success: boolean; data: Record<string, unknown> }>(
      '/',
    );
  },

  // FCM 토큰 등록
  registerToken: (tokenData: FCMTokenRegisterRequest) => {
    return apiClient.post<{
      success: boolean;
      data: FCMTokenResponse;
      message?: string;
    }>(
      '/api/notifications/tokens',
      tokenData as unknown as Record<string, unknown>,
    );
  },

  // 사용자의 FCM 토큰 목록 조회
  getTokens: () => {
    return apiClient.get<{ success: boolean; data: FCMTokenResponse[] }>(
      '/api/notifications/tokens',
    );
  },

  // FCM 토큰 삭제 (비활성화)
  deleteToken: (tokenId: string) => {
    return apiClient.delete<{ success: boolean; data: string }>(
      `/api/notifications/tokens/${tokenId}`,
    );
  },

  // 알림 설정 조회
  getNotificationSettings: () => {
    return apiClient.get<{
      success: boolean;
      data: NotificationSettingsResponse;
    }>('/api/notifications/settings');
  },

  // 알림 설정 업데이트
  updateNotificationSettings: (settings: NotificationSettingsUpdate) => {
    return apiClient.patch<{
      success: boolean;
      data: NotificationSettingsResponse;
    }>(
      '/api/notifications/settings',
      settings as unknown as Record<string, unknown>,
    );
  },

  // 푸시 알림 전송 (관리자용)
  sendNotification: (notification: NotificationSendRequest) => {
    return apiClient.post<{ success: boolean; data: NotificationSendResponse }>(
      '/api/notifications/send',
      notification as unknown as Record<string, unknown>,
    );
  },

  // 다이어리 작성 알림 전송
  sendDiaryReminder: () => {
    return apiClient.post<{ success: boolean; data: NotificationSendResponse }>(
      '/api/notifications/diary-reminder',
      {},
    );
  },

  // AI 콘텐츠 준비 완료 알림 전송
  sendAiContentReady: (diaryId: string) => {
    return apiClient.post<{ success: boolean; data: NotificationSendResponse }>(
      `/api/notifications/ai-content-ready/${diaryId}`,
      {},
    );
  },

  // 알림 전송 기록 조회
  getNotificationHistory: (
    limit: number = VALIDATION.NOTIFICATION_HISTORY_DEFAULT_LIMIT,
    offset: number = 0,
  ) => {
    return apiClient.get<{
      success: boolean;
      data: NotificationHistoryResponse[];
    }>('/api/notifications/history', {
      limit: limit.toString(),
      offset: offset.toString(),
    });
  },

  // 개별 알림 읽음 처리
  markNotificationAsRead: (notificationId: string) => {
    return apiClient.patch<{ success: boolean; data: Record<string, unknown> }>(
      `/api/notifications/${notificationId}/read`,
      {},
    );
  },

  // 모든 알림 읽음 처리
  markAllNotificationsAsRead: () => {
    return apiClient.patch<{ success: boolean; data: Record<string, unknown> }>(
      '/api/notifications/read-all',
      {},
    );
  },
};
