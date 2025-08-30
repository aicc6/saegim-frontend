'use client';

import { VALIDATION } from '@/constants/timeouts';
import type {
  NotificationSettings,
  NotificationHistory,
  NotificationPermission,
  SaeGimNotificationData,
} from '../types/fcm';
import type { EmotionType } from '../types/diary';
import { requestFCMToken, onMessageListener } from '../lib/firebase';
import {
  notificationApi,
  type FCMTokenRegisterRequest,
  type NotificationSettingsUpdate,
} from '../lib/notification-api';
import { getLogger } from '../lib/logger';

const logger = getLogger('notification-service');

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  diaryReminder: true,
  aiContentReady: true,
  emotionTrend: true,
  anniversary: true,
  friendShare: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  frequency: 'immediate',
};

export class NotificationService {
  static async requestPermission(): Promise<{
    permission: NotificationPermission;
    isSupported: boolean;
  }> {
    try {
      if (!('Notification' in window)) {
        throw new Error('이 브라우저는 알림 기능을 지원하지 않습니다.');
      }

      const permission = await Notification.requestPermission();

      logger.info('알림 권한 요청 결과', { permission });

      return {
        permission: permission as NotificationPermission,
        isSupported: permission !== 'denied',
      };
    } catch (error) {
      logger.error('알림 권한 요청 실패', { error });
      throw new Error(
        error instanceof Error
          ? error.message
          : '알림 권한 요청에 실패했습니다.',
      );
    }
  }

  static async registerToken(): Promise<{
    token: string;
    isRegistered: boolean;
  }> {
    try {
      const token = await requestFCMToken();

      if (!token) {
        throw new Error('FCM 토큰 생성에 실패했습니다.');
      }

      const tokenData: FCMTokenRegisterRequest = {
        token,
        device_type: 'web',
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      };

      const response = await notificationApi.registerToken(tokenData);

      if (!response.success) {
        throw new Error(response.message || 'FCM 토큰 등록에 실패했습니다.');
      }

      logger.info('FCM 토큰 등록 성공', {
        tokenPreview: token.substring(0, 20) + '...',
        responseData: response.data,
      });

      return {
        token,
        isRegistered: true,
      };
    } catch (error) {
      logger.error('FCM 토큰 등록 실패', { error });
      throw new Error(
        error instanceof Error
          ? error.message
          : 'FCM 토큰 등록에 실패했습니다.',
      );
    }
  }

  static async updateSettings(
    newSettings: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    try {
      const backendSettings: NotificationSettingsUpdate = {
        diary_reminder: newSettings.diaryReminder,
        ai_content_ready: newSettings.aiContentReady,
        weekly_report: newSettings.emotionTrend,
        marketing: newSettings.friendShare,
        quiet_hours_start: newSettings.quietHours?.enabled
          ? newSettings.quietHours.startTime
          : null,
        quiet_hours_end: newSettings.quietHours?.enabled
          ? newSettings.quietHours.endTime
          : null,
      };

      const response =
        await notificationApi.updateNotificationSettings(backendSettings);

      if (!response.success) {
        throw new Error(
          response.message || '알림 설정 업데이트에 실패했습니다.',
        );
      }

      const updatedSettings = { ...DEFAULT_SETTINGS, ...newSettings };

      logger.info('알림 설정 업데이트 성공', {
        settings: updatedSettings,
        responseData: response.data,
      });

      return updatedSettings;
    } catch (error) {
      logger.error('알림 설정 업데이트 실패', { error, newSettings });
      throw new Error(
        error instanceof Error
          ? error.message
          : '알림 설정 업데이트에 실패했습니다.',
      );
    }
  }

  static async syncSettingsFromServer(): Promise<NotificationSettings | null> {
    try {
      const response = await notificationApi.getNotificationSettings();

      if (response.success && response.data) {
        const serverSettings = response.data;

        const frontendSettings: NotificationSettings = {
          enabled: true,
          diaryReminder: serverSettings.diary_reminder,
          aiContentReady: serverSettings.ai_content_ready,
          emotionTrend: serverSettings.weekly_report,
          anniversary: true,
          friendShare: serverSettings.marketing,
          quietHours: {
            enabled: !!(
              serverSettings.quiet_hours_start && serverSettings.quiet_hours_end
            ),
            startTime: serverSettings.quiet_hours_start || '22:00',
            endTime: serverSettings.quiet_hours_end || '08:00',
          },
          frequency: 'immediate',
        };

        logger.info('서버 알림 설정 동기화 성공', { frontendSettings });
        return frontendSettings;
      }

      return null;
    } catch (error) {
      logger.error('서버에서 알림 설정 조회 실패', { error });
      return null;
    }
  }

  static async getUserTokens(): Promise<unknown[]> {
    try {
      const response = await notificationApi.getTokens();
      if (response.success) {
        logger.info('사용자 토큰 목록 조회 성공', {
          count: response.data?.length,
        });
        return response.data || [];
      }
      return [];
    } catch (error) {
      logger.error('사용자 토큰 목록 조회 실패', { error });
      return [];
    }
  }

  static async deleteToken(tokenId: string): Promise<boolean> {
    try {
      const response = await notificationApi.deleteToken(tokenId);
      if (response.success) {
        logger.info('토큰 삭제 성공', { tokenId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('토큰 삭제 실패', { error, tokenId });
      return false;
    }
  }

  static async getNotificationHistory(
    limit: number = VALIDATION.NOTIFICATION_HISTORY_DEFAULT_LIMIT,
    offset: number = 0,
  ): Promise<unknown[]> {
    try {
      const response = await notificationApi.getNotificationHistory(
        limit,
        offset,
      );
      if (response.success) {
        logger.info('알림 히스토리 조회 성공', {
          count: response.data?.length,
          limit,
          offset,
        });
        return response.data || [];
      }
      return [];
    } catch (error) {
      logger.error('알림 히스토리 조회 실패', { error, limit, offset });
      return [];
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await notificationApi.checkHealth();
      const isHealthy = response.success;

      logger.info('FCM 서비스 상태 확인', { isHealthy });
      return isHealthy;
    } catch (error) {
      logger.error('FCM 서비스 상태 확인 실패', { error });
      return false;
    }
  }

  static createNotificationFromPayload(payload: unknown): NotificationHistory {
    const fcmPayload = payload as {
      notification?: { title?: string; body?: string };
      data?: {
        type?: string;
        emotion?: string;
        [key: string]: string | undefined;
      };
    };

    const notification: NotificationHistory = {
      id: Date.now().toString(),
      type: (fcmPayload.data?.type as NotificationHistory['type']) || 'general',
      title: fcmPayload.notification?.title || '새김 알림',
      body: fcmPayload.notification?.body || '새로운 알림이 도착했습니다.',
      emotion: fcmPayload.data?.emotion as EmotionType,
      data: fcmPayload.data as SaeGimNotificationData,
      sentAt: new Date().toISOString(),
      isRead: false,
      isClicked: false,
    };

    logger.debug('알림 페이로드 변환 완료', {
      notificationId: notification.id,
      type: notification.type,
    });

    return notification;
  }
}

export class BrowserNotificationService {
  static showBrowserNotification(notification: NotificationHistory): void {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/images/logo.webp',
        badge: '/images/logo.webp',
        tag: notification.type,
        data: notification.data,
        requireInteraction: true,
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();

        logger.info('브라우저 알림 클릭됨', {
          notificationId: notification.id,
          url: notification.data?.url,
        });

        if (notification.data?.url) {
          window.location.href = notification.data.url;
        }
      };

      logger.debug('브라우저 알림 표시됨', {
        notificationId: notification.id,
        title: notification.title,
      });
    }
  }

  static showInAppNotification(notification: NotificationHistory): void {
    logger.debug('인앱 알림 표시', { notification });
    this.showBrowserNotification(notification);
  }

  static setupForegroundListener(
    onNotificationReceived: (notification: NotificationHistory) => void,
    onFocusedNotification?: (notification: NotificationHistory) => void,
  ): () => void {
    const unsubscribe = () => {};

    onMessageListener()
      .then((payload: unknown) => {
        logger.debug('포그라운드 메시지 수신', { payload });

        const notification =
          NotificationService.createNotificationFromPayload(payload);
        onNotificationReceived(notification);

        if (!document.hasFocus()) {
          this.showBrowserNotification(notification);
        } else {
          if (onFocusedNotification) {
            onFocusedNotification(notification);
          } else {
            this.showInAppNotification(notification);
          }
        }
      })
      .catch((error) => {
        logger.error('포그라운드 메시지 리스너 오류', { error });
      });

    return unsubscribe;
  }
}
