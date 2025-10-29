// FCM 푸시 알림 관리 스토어 (Zustand)

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { toast } from '@/hooks/use-toast';
import { VALIDATION } from '@/constants/timeouts';
import {
  notificationApi,
  type FCMTokenRegisterRequest,
} from '@/lib/api/notification';
import { requestFCMToken, onMessageListener } from '../lib/firebase';
import { getLogger } from '../lib/logger';
import type {
  FCMState,
  NotificationSettings,
  NotificationHistory,
  NotificationPermission,
  SaeGimNotificationData,
} from '../types/fcm';
import type { EmotionType } from '../types/diary';

const logger = getLogger('fcm');

// 기본 알림 설정 - notification_settings 테이블 구조와 일치
const DEFAULT_SETTINGS: NotificationSettings = {
  id: '',
  user_id: '',
  push_enabled: true,
  diary_reminder_enabled: true,
  diary_reminder_time: '21:00', // DB 기본값과 동일
  diary_reminder_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // 주중 기본값
  report_notification_enabled: true,
  ai_processing_enabled: true,
  browser_push_enabled: false, // DB 기본값과 동일
  created_at: '',
  updated_at: '',
};

// FCM 스토어 생성
export const useFCMStore = create<FCMState>()(
  immer((set, get) => ({
    // 초기 상태
    token: null,
    isTokenRegistered: false,
    permission: 'default',
    isSupported: false,
    settings: DEFAULT_SETTINGS,
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    // 알림 권한 요청
    requestPermission: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // 브라우저 알림 권한 확인
        if (!('Notification' in window)) {
          throw new Error('이 브라우저는 알림 기능을 지원하지 않습니다.');
        }

        // 권한 요청
        const permission = await Notification.requestPermission();

        set((state) => {
          state.permission = permission as NotificationPermission;
          state.isSupported = permission !== 'denied';
          state.isLoading = false;
        });

        if (permission === 'granted') {
          // 권한이 허용되면 토큰 등록
          await get().registerToken();
          return true;
        }

        return false;
      } catch (error) {
        logger.error('알림 권한 요청 실패:', error);
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : '알림 권한 요청에 실패했습니다.';
          state.isLoading = false;
        });
        return false;
      }
    },

    // FCM 토큰 등록
    registerToken: async () => {
      const currentState = get();

      // 이미 토큰이 등록되어 있고 로딩 중이 아닌 경우 중복 방지
      if (
        currentState.isTokenRegistered &&
        currentState.token &&
        !currentState.isLoading
      ) {
        logger.debug(
          'FCM 토큰이 이미 등록되어 있습니다:',
          currentState.token.substring(0, 20) + '...',
        );
        return;
      }

      // 이미 토큰 등록 진행 중인 경우 중복 방지
      if (currentState.isLoading) {
        logger.debug('FCM 토큰 등록이 이미 진행 중입니다.');
        return;
      }

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const token = await requestFCMToken();

        if (token) {
          // 현재 토큰과 동일한 경우 서버 등록 건너뛰기
          if (currentState.token === token && currentState.isTokenRegistered) {
            logger.debug('동일한 FCM 토큰이 이미 등록되어 있습니다.');
            set((state) => {
              state.isLoading = false;
            });
            return;
          }

          // 백엔드 API를 통해 토큰 등록
          const tokenData: FCMTokenRegisterRequest = {
            token,
            device_type: 'web',
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
            },
          };

          const response = await notificationApi.registerToken(tokenData);

          if (response.success) {
            set((state) => {
              state.token = token;
              state.isTokenRegistered = true;
              state.isLoading = false;
            });

            // 포그라운드 메시지 리스너 설정 (한 번만)
            if (!currentState.token) {
              setupForegroundListener();
            }

            logger.info('FCM 토큰 등록 성공');
            logger.debug('토큰 데이터:', response.data);
          } else {
            throw new Error(
              response.message || 'FCM 토큰 등록에 실패했습니다.',
            );
          }
        } else {
          throw new Error('FCM 토큰 생성에 실패했습니다.');
        }
      } catch (error) {
        logger.error('FCM 토큰 등록 실패:', error);
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : 'FCM 토큰 등록에 실패했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 알림 설정 업데이트
    updateSettings: async (newSettings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // NotificationSettingsUpdate 타입이 백엔드와 일치하므로 직접 전달
        const response =
          await notificationApi.updateNotificationSettings(newSettings);

        if (response.success && response.data) {
          // 서버 응답 데이터로 전체 설정 업데이트
          set((state) => {
            state.settings = response.data as unknown as NotificationSettings;
            state.isLoading = false;
          });

          logger.info('알림 설정 업데이트 성공');
          logger.debug('설정 데이터:', response.data);
        } else {
          throw new Error(
            response.message || '알림 설정 업데이트에 실패했습니다.',
          );
        }
      } catch (error) {
        logger.error('알림 설정 업데이트 실패:', error);
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : '알림 설정 업데이트에 실패했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 알림 설정 로드
    loadSettings: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const serverSettings = await syncSettingsFromServer();

        if (serverSettings) {
          set((state) => {
            state.settings = serverSettings;
            state.isLoading = false;
          });

          logger.debug('알림 설정 로드 성공:', serverSettings);
        } else {
          set((state) => {
            state.isLoading = false;
          });
        }
      } catch (error) {
        logger.error('알림 설정 로드 실패:', error);
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : '알림 설정 로드에 실패했습니다.';
          state.isLoading = false;
        });
      }
    },

    // 알림을 읽음으로 표시
    markAsRead: (notificationId) => {
      set((state) => {
        const notification = state.notifications.find(
          (n) => n.id === notificationId,
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
    },

    // 모든 알림을 읽음으로 표시
    markAllAsRead: () => {
      set((state) => {
        state.notifications.forEach((notification) => {
          if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      });
    },

    // 알림 히스토리 삭제
    clearHistory: () => {
      set((state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
    },
  })),
);

// 백엔드에서 알림 설정을 가져와 동기화하는 함수
const syncSettingsFromServer =
  async (): Promise<NotificationSettings | null> => {
    try {
      const response = await notificationApi.getNotificationSettings();

      if (response.success && response.data) {
        // NotificationSettingsResponse 타입이 NotificationSettings와 일치하므로 직접 반환
        return response.data as unknown as NotificationSettings;
      }

      return null;
    } catch (error) {
      logger.error('서버에서 알림 설정 조회 실패:', error);
      return null;
    }
  };

// 포그라운드 메시지 리스너 설정
const setupForegroundListener = (): void => {
  onMessageListener()
    .then((payload: unknown) => {
      logger.debug('포그라운드 메시지 수신:', payload);

      // Firebase payload를 안전하게 처리
      const fcmPayload = payload as {
        notification?: { title?: string; body?: string };
        data?: {
          type?: string;
          emotion?: string;
          [key: string]: string | undefined;
        };
      };

      // 새김 스토어에 알림 추가
      const notification: NotificationHistory = {
        id: Date.now().toString(),
        type:
          (fcmPayload.data?.type as NotificationHistory['type']) || 'general',
        title: fcmPayload.notification?.title || '새김 알림',
        body: fcmPayload.notification?.body || '새로운 알림이 도착했습니다.',
        emotion: fcmPayload.data?.emotion as EmotionType,
        data: fcmPayload.data as SaeGimNotificationData,
        sentAt: new Date().toISOString(),
        isRead: false,
        isClicked: false,
      };

      useFCMStore.getState().addNotification?.(notification);

      // 브라우저 알림 표시 (포커스가 없을 때만)
      if (!document.hasFocus()) {
        showBrowserNotification(notification);
      } else {
        // 인앱 토스트 알림 표시
        showInAppNotification(notification);
      }
    })
    .catch((error) => {
      logger.error('포그라운드 메시지 리스너 오류:', error);
    });
};

// 브라우저 알림 표시
const showBrowserNotification = (notification: NotificationHistory): void => {
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

      // 클릭 이벤트 기록
      useFCMStore.getState().markAsClicked?.(notification.id);

      // 해당 페이지로 이동
      if (notification.data?.url) {
        window.location.href = notification.data.url;
      }
    };
  }
};

// 인앱 알림 표시 (토스트)
const showInAppNotification = (notification: NotificationHistory): void => {
  logger.debug('인앱 알림 표시:', notification);

  // toast 라이브러리 연동
  toast({
    title: notification.title,
    description: notification.body,
    duration: 5000,
  });

  // 브라우저 알림도 함께 표시 (사용자가 페이지를 보지 않을 수 있음)
  showBrowserNotification(notification);
};

// 사용자 토큰 목록 조회 함수
const getUserTokens = async () => {
  try {
    const response = await notificationApi.getTokens();
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error('사용자 토큰 목록 조회 실패:', error);
    return [];
  }
};

// 토큰 삭제 함수
const deleteUserToken = async (tokenId: string) => {
  try {
    const response = await notificationApi.deleteToken(tokenId);
    if (response.success) {
      logger.debug('토큰 삭제 성공:', tokenId);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('토큰 삭제 실패:', error);
    return false;
  }
};

// 알림 히스토리 조회 함수
const getNotificationHistory = async (
  limit: number = VALIDATION.NOTIFICATION_HISTORY_DEFAULT_LIMIT,
  offset: number = 0,
) => {
  try {
    const response = await notificationApi.getNotificationHistory(
      limit,
      offset,
    );
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error('알림 히스토리 조회 실패:', error);
    return [];
  }
};

// FCM 스토어 초기화 함수
export const initializeFCM = async (): Promise<void> => {
  const store = useFCMStore.getState();

  logger.info('FCM 스토어 초기화 시작...');

  // 브라우저 지원 확인
  if ('Notification' in window && 'serviceWorker' in navigator) {
    logger.info('브라우저가 FCM을 지원합니다.');
    useFCMStore.setState({ isSupported: true });

    // Service Worker 등록 확인
    try {
      const registration = await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js',
      );
      if (!registration) {
        logger.debug('Service Worker를 등록합니다...');
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        logger.debug('Service Worker 등록 완료');
      } else {
        logger.debug('Service Worker가 이미 등록되어 있습니다.');
      }
    } catch (error) {
      logger.error('Service Worker 등록 실패:', error);
    }

    // 현재 권한 상태 확인
    const permission = Notification.permission as NotificationPermission;
    useFCMStore.setState({ permission });
    logger.debug('현재 알림 권한 상태:', permission);

    // 백엔드에서 알림 설정 동기화
    const serverSettings = await syncSettingsFromServer();
    if (serverSettings) {
      useFCMStore.setState({ settings: serverSettings });
      logger.debug('서버 알림 설정 동기화 완료');
    }

    // 이미 권한이 있으면 토큰 등록
    if (permission === 'granted') {
      logger.debug('알림 권한이 이미 허용되어 있어 토큰 등록을 시도합니다.');
      await store.registerToken();
    }
  } else {
    logger.warn('FCM이 지원되지 않는 브라우저입니다.');
    useFCMStore.setState({ isSupported: false });
  }

  logger.info('FCM 스토어 초기화 완료');
};

// 스토어에 알림 추가 액션 (동적으로 추가)
// 스토어에 추가 액션들을 동적으로 추가
useFCMStore.setState((state) => ({
  ...state,
  addNotification: (notification: NotificationHistory) => {
    useFCMStore.setState((prevState) => ({
      notifications: [notification, ...prevState.notifications].slice(
        0,
        VALIDATION.NOTIFICATION_MAX_COUNT,
      ),
      unreadCount: prevState.unreadCount + 1,
    }));
  },
  markAsClicked: (notificationId: string) => {
    useFCMStore.setState((prevState) => ({
      notifications: prevState.notifications.map((n) =>
        n.id === notificationId
          ? { ...n, isClicked: true, clickedAt: new Date().toISOString() }
          : n,
      ),
    }));
  },

  // 토큰 관리 관련 추가 액션들
  getUserTokens,
  deleteToken: deleteUserToken,

  // 알림 히스토리 관련 액션들
  loadNotificationHistory: getNotificationHistory,

  // FCM 서비스 상태 확인
  checkFCMHealth: async () => {
    try {
      const response = await notificationApi.checkHealth();
      return response.success && !!response.data;
    } catch (error) {
      logger.error('FCM 서비스 상태 확인 실패:', error);
      return false;
    }
  },
}));

export default useFCMStore;
