/**
 * Notification API 클라이언트
 * 백엔드 통합 Notification API와의 통신을 담당합니다.
 * (FCM + 인앱 알림 통합)
 */

import { apiClient } from './api';

// Notification API 스키마 타입 정의 (백엔드 통합 API 기반)
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
  diary_reminder?: boolean;
  ai_content_ready?: boolean;
  weekly_report?: boolean;
  marketing?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

export interface NotificationSettingsResponse {
  diary_reminder: boolean;
  ai_content_ready: boolean;
  weekly_report: boolean;
  marketing: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
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

/**
 * 통합 Notification API 클라이언트 클래스
 * FCM 토큰 관리, 알림 설정, 알림 전송 등 모든 알림 관련 기능을 제공
 */
class NotificationApiClient {
  /**
   * 알림 서비스 상태 확인
   */
  async checkHealth() {
    return apiClient.get<string>('/api/notifications/health');
  }

  /**
   * FCM 토큰 등록
   * @param tokenData 등록할 토큰 정보
   */
  async registerToken(tokenData: FCMTokenRegisterRequest) {
    return apiClient.post<FCMTokenResponse>(
      '/api/notifications/tokens/register',
      tokenData as unknown as Record<string, unknown>,
    );
  }

  /**
   * 사용자의 FCM 토큰 목록 조회
   */
  async getTokens() {
    return apiClient.get<FCMTokenResponse[]>('/api/notifications/tokens');
  }

  /**
   * FCM 토큰 삭제 (비활성화)
   * @param tokenId 삭제할 토큰 ID
   */
  async deleteToken(tokenId: string) {
    return apiClient.delete<boolean>(`/api/notifications/tokens/${tokenId}`);
  }

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings() {
    return apiClient.get<NotificationSettingsResponse>('/api/notifications/settings');
  }

  /**
   * 알림 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateNotificationSettings(settings: NotificationSettingsUpdate) {
    return apiClient.put<NotificationSettingsResponse>(
      '/api/notifications/settings',
      settings as unknown as Record<string, unknown>,
    );
  }

  /**
   * 푸시 알림 전송 (관리자용)
   * @param notification 전송할 알림 정보
   */
  async sendNotification(notification: NotificationSendRequest) {
    return apiClient.post<NotificationSendResponse>(
      '/api/notifications/send',
      notification as unknown as Record<string, unknown>,
    );
  }

  /**
   * 다이어리 작성 알림 전송
   * 현재 인증된 사용자에게 다이어리 작성 알림을 전송합니다.
   */
  async sendDiaryReminder() {
    return apiClient.post<NotificationSendResponse>(
      '/api/notifications/send/diary-reminder',
      {},
    );
  }

  /**
   * AI 콘텐츠 준비 완료 알림 전송
   * 현재 인증된 사용자에게 AI 콘텐츠 준비 완료 알림을 전송합니다.
   * @param diaryId 다이어리 ID
   */
  async sendAiContentReady(diaryId: string) {
    return apiClient.post<NotificationSendResponse>(
      `/api/notifications/send/ai-content-ready/${diaryId}`,
      {},
    );
  }

  /**
   * 알림 전송 기록 조회
   * @param limit 조회할 개수 (기본: 20)
   * @param offset 오프셋 (기본: 0)
   */
  async getNotificationHistory(limit: number = 20, offset: number = 0) {
    return apiClient.get<NotificationHistoryResponse[]>('/api/notifications/history', {
      limit: limit.toString(),
      offset: offset.toString(),
    });
  }
}

// Notification API 클라이언트 인스턴스 생성 및 내보내기  
export const notificationApi = new NotificationApiClient();

// 편의를 위한 개별 함수 내보내기
export const {
  checkHealth: checkNotificationHealth,
  registerToken: registerFCMToken,
  getTokens: getFCMTokens,
  deleteToken: deleteFCMToken,
  getNotificationSettings,
  updateNotificationSettings,
  sendNotification,
  sendDiaryReminder,
  sendAiContentReady,
  getNotificationHistory,
} = notificationApi;

// 하위 호환성을 위한 FCM API 별칭 (기존 코드와의 호환성)
export const fcmApi = notificationApi;
export const checkFCMHealth = checkNotificationHealth;
