/**
 * 통합 API 모듈
 * 모든 API 관련 함수들의 중앙 진입점
 */

// 중앙화된 API 클라이언트
export { apiClient, API_BASE_URL } from './client';
export type { ApiResponse, PaginationInfo } from './client';

// 도메인별 API 모듈들
export { authApi } from './auth';
export type { LoginResponse, PasswordResetEmailResponse } from './auth';

export { diaryApi } from './diary';

export { calendarApi } from './calendar';

export { imageApi } from './image';

export { aiApi } from './ai';
export type { AIGenerationResult } from './ai';

export * from './app-version';

import { notificationApi as _notificationApi } from './notification';
export { notificationApi } from './notification';
export type {
  FCMTokenRegisterRequest,
  FCMTokenResponse,
  NotificationSettingsUpdate,
  NotificationSettingsResponse,
  NotificationSendRequest,
  NotificationSendResponse,
  NotificationHistoryResponse,
} from './notification';

// 편의를 위한 개별 함수 내보내기 (하위 호환성)
export const checkNotificationHealth = _notificationApi.checkHealth;
export const registerFCMToken = _notificationApi.registerToken;
export const getFCMTokens = _notificationApi.getTokens;
export const deleteFCMToken = _notificationApi.deleteToken;
export const getNotificationSettings = _notificationApi.getNotificationSettings;
export const updateNotificationSettings =
  _notificationApi.updateNotificationSettings;
export const sendNotification = _notificationApi.sendNotification;
export const sendDiaryReminder = _notificationApi.sendDiaryReminder;
export const sendAiContentReady = _notificationApi.sendAiContentReady;
export const getNotificationHistory = _notificationApi.getNotificationHistory;

// 하위 호환성을 위한 FCM API 별칭 (기존 코드와의 호환성)
export const fcmApi = _notificationApi;
export const checkFCMHealth = checkNotificationHealth;
