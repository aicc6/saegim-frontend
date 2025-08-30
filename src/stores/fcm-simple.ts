import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { VALIDATION } from '@/constants/timeouts';
import {
  NotificationService,
  BrowserNotificationService,
} from '@/services/notification-service';
import {
  createInitialErrorState,
  ErrorState,
  handleApiError,
} from '@/lib/store-helpers';
import type {
  NotificationSettings,
  NotificationHistory,
  NotificationPermission,
} from '../types/fcm';
import { getLogger } from '../lib/logger';

const logger = getLogger('fcm-store');

interface FCMState extends ErrorState {
  token: string | null;
  isTokenRegistered: boolean;
  permission: NotificationPermission;
  isSupported: boolean;
  settings: NotificationSettings;
  notifications: NotificationHistory[];
  unreadCount: number;

  // Actions
  requestPermission: () => Promise<boolean>;
  registerToken: () => Promise<void>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  addNotification: (notification: NotificationHistory) => void;
  markAsClicked: (notificationId: string) => void;
  getUserTokens: () => Promise<unknown[]>;
  deleteToken: (tokenId: string) => Promise<boolean>;
  loadNotificationHistory: (
    limit?: number,
    offset?: number,
  ) => Promise<unknown[]>;
  checkFCMHealth: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultSettings: NotificationSettings = {
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

export const useFCMStore = create<FCMState>()(
  immer((set, get) => ({
    ...createInitialErrorState(),
    token: null,
    isTokenRegistered: false,
    permission: 'default',
    isSupported: false,
    settings: defaultSettings,
    notifications: [],
    unreadCount: 0,

    clearError: () =>
      set((state) => {
        state.error = null;
      }),
    setLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),
    setError: (error) =>
      set((state) => {
        state.error = error;
        state.isLoading = false;
      }),

    requestPermission: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const result = await NotificationService.requestPermission();

        set((state) => {
          state.permission = result.permission;
          state.isSupported = result.isSupported;
          state.isLoading = false;
          state.error = null;
        });

        if (result.permission === 'granted') {
          await get().registerToken();
          return true;
        }

        return false;
      } catch (error) {
        const errorMessage = handleApiError(error, '알림 권한 요청');
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        return false;
      }
    },

    registerToken: async () => {
      const currentState = get();

      if (
        currentState.isTokenRegistered &&
        currentState.token &&
        !currentState.isLoading
      ) {
        logger.debug('FCM 토큰이 이미 등록되어 있습니다');
        return;
      }

      if (currentState.isLoading) {
        logger.debug('FCM 토큰 등록이 이미 진행 중입니다');
        return;
      }

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const currentToken = currentState.token;
        const result = await NotificationService.registerToken();

        if (currentToken === result.token && currentState.isTokenRegistered) {
          logger.debug('동일한 FCM 토큰이 이미 등록되어 있습니다');
          set((state) => {
            state.isLoading = false;
          });
          return;
        }

        set((state) => {
          state.token = result.token;
          state.isTokenRegistered = result.isRegistered;
          state.isLoading = false;
          state.error = null;
        });

        if (!currentToken) {
          setupForegroundListener();
        }
      } catch (error) {
        const errorMessage = handleApiError(error, 'FCM 토큰 등록');
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
      }
    },

    updateSettings: async (newSettings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const updatedSettings =
          await NotificationService.updateSettings(newSettings);

        set((state) => {
          state.settings = updatedSettings;
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        const errorMessage = handleApiError(error, '알림 설정 업데이트');
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
      }
    },

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

    clearHistory: () => {
      set((state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
    },

    addNotification: (notification) => {
      set((state) => {
        state.notifications = [notification, ...state.notifications].slice(
          0,
          VALIDATION.NOTIFICATION_MAX_COUNT,
        );
        state.unreadCount = state.unreadCount + 1;
      });
    },

    markAsClicked: (notificationId) => {
      set((state) => {
        const notification = state.notifications.find(
          (n) => n.id === notificationId,
        );
        if (notification) {
          notification.isClicked = true;
          notification.clickedAt = new Date().toISOString();
        }
      });
    },

    getUserTokens: async () => {
      return await NotificationService.getUserTokens();
    },

    deleteToken: async (tokenId) => {
      return await NotificationService.deleteToken(tokenId);
    },

    loadNotificationHistory: async (limit, offset) => {
      return await NotificationService.getNotificationHistory(limit, offset);
    },

    checkFCMHealth: async () => {
      return await NotificationService.checkHealth();
    },
  })),
);

// 포그라운드 리스너 설정
let foregroundListenerCleanup: (() => void) | null = null;

const setupForegroundListener = (): void => {
  if (foregroundListenerCleanup) {
    foregroundListenerCleanup();
  }

  foregroundListenerCleanup =
    BrowserNotificationService.setupForegroundListener(
      (notification) => {
        useFCMStore.getState().addNotification(notification);
      },
      (notification) => {
        BrowserNotificationService.showInAppNotification(notification);
      },
    );
};

// FCM 스토어 초기화 함수
export const initializeFCM = async (): Promise<void> => {
  const store = useFCMStore.getState();

  logger.info('FCM 스토어 초기화 시작');

  if ('Notification' in window && 'serviceWorker' in navigator) {
    logger.info('브라우저가 FCM을 지원합니다');
    useFCMStore.setState((state) => {
      state.isSupported = true;
    });

    try {
      const registration = await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js',
      );
      if (!registration) {
        logger.info('Service Worker를 등록합니다');
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        logger.info('Service Worker 등록 완료');
      } else {
        logger.debug('Service Worker가 이미 등록되어 있습니다');
      }
    } catch (error) {
      logger.error('Service Worker 등록 실패', { error });
    }

    const permission = Notification.permission as NotificationPermission;
    useFCMStore.setState((state) => {
      state.permission = permission;
    });
    logger.debug('현재 알림 권한 상태', { permission });

    const serverSettings = await NotificationService.syncSettingsFromServer();
    if (serverSettings) {
      useFCMStore.setState((state) => {
        state.settings = serverSettings;
      });
      logger.info('서버 알림 설정 동기화 완료');
    }

    if (permission === 'granted') {
      logger.info('알림 권한이 이미 허용되어 있어 토큰 등록을 시도합니다');
      await store.registerToken();
    }
  } else {
    logger.warn('FCM이 지원되지 않는 브라우저입니다');
    useFCMStore.setState((state) => {
      state.isSupported = false;
    });
  }

  logger.info('FCM 스토어 초기화 완료');
};

export const cleanupFCMStore = () => {
  if (foregroundListenerCleanup) {
    foregroundListenerCleanup();
    foregroundListenerCleanup = null;
  }
};

export default useFCMStore;
