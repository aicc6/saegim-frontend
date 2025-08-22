/**
 * FCM API 클라이언트
 * 백엔드 FCM API와의 통신을 담당합니다.
 */

import { apiClient } from './api';

// FCM API 스키마 타입 정의 (백엔드 OpenAPI 스키마 기반)
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
  notification_type: 'diary_reminder' | 'ai_content_ready' | 'weekly_report' | 'marketing' | 'general';
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
 * FCM API 클라이언트 클래스
 */
class FCMApiClient {
  /**
   * FCM 서비스 상태 확인
   */
  async checkHealth() {
    return apiClient.get<string>('/api/fcm/health');
  }

  /**
   * FCM 토큰 등록
   * @param tokenData 등록할 토큰 정보
   */
  async registerToken(tokenData: FCMTokenRegisterRequest) {
    return apiClient.post<FCMTokenResponse>('/api/fcm/register-token', tokenData);
  }

  /**
   * 사용자의 FCM 토큰 목록 조회
   */
  async getTokens() {
    return apiClient.get<FCMTokenResponse[]>('/api/fcm/tokens');
  }

  /**
   * FCM 토큰 삭제 (비활성화)
   * @param tokenId 삭제할 토큰 ID
   */
  async deleteToken(tokenId: string) {
    return apiClient.delete<boolean>(`/api/fcm/tokens/${tokenId}`);
  }

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings() {
    return apiClient.get<NotificationSettingsResponse>('/api/fcm/settings');
  }

  /**
   * 알림 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateNotificationSettings(settings: NotificationSettingsUpdate) {
    return apiClient.put<NotificationSettingsResponse>('/api/fcm/settings', settings);
  }

  /**
   * 푸시 알림 전송 (관리자용)
   * @param notification 전송할 알림 정보
   */
  async sendNotification(notification: NotificationSendRequest) {
    return apiClient.post<NotificationSendResponse>('/api/fcm/send-notification', notification);
  }

  /**
   * 다이어리 작성 알림 전송
   * @param userId 대상 사용자 ID
   */
  async sendDiaryReminder(userId: string) {
    return apiClient.post<NotificationSendResponse>(`/api/fcm/send-diary-reminder/${userId}`, {});
  }

  /**
   * AI 콘텐츠 준비 완료 알림 전송
   * @param userId 대상 사용자 ID
   * @param diaryId 다이어리 ID
   */
  async sendAiContentReady(userId: string, diaryId: string) {
    return apiClient.post<NotificationSendResponse>(`/api/fcm/send-ai-content-ready/${userId}/${diaryId}`, {});
  }

  /**
   * 알림 전송 기록 조회
   * @param limit 조회할 개수 (기본: 20)
   * @param offset 오프셋 (기본: 0)
   */
  async getNotificationHistory(limit: number = 20, offset: number = 0) {
    return apiClient.get<NotificationHistoryResponse[]>('/api/fcm/history', {
      limit: limit.toString(),
      offset: offset.toString(),
    });
  }
}

// FCM API 클라이언트 인스턴스 생성 및 내보내기
export const fcmApi = new FCMApiClient();

// 편의를 위한 개별 함수 내보내기
export const {
  checkHealth: checkFCMHealth,
  registerToken: registerFCMToken,
  getTokens: getFCMTokens,
  deleteToken: deleteFCMToken,
  getNotificationSettings,
  updateNotificationSettings,
  sendNotification,
  sendDiaryReminder,
  sendAiContentReady,
  getNotificationHistory,
} = fcmApi;