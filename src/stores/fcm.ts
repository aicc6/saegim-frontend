// FCM 푸시 알림 관리 스토어 (Zustand)

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  FCMState,
  NotificationSettings,
  NotificationHistory,
  NotificationPermission,
  SaeGimNotificationData,
} from '../types/fcm';
import type { EmotionType } from '../types';
import { requestFCMToken, onMessageListener } from '../lib/firebase';

// 기본 알림 설정
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
        console.error('알림 권한 요청 실패:', error);
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
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const token = await requestFCMToken();

        if (token) {
          set((state) => {
            state.token = token;
            state.isTokenRegistered = true;
            state.isLoading = false;
          });

          // 토큰을 서버에 전송
          await sendTokenToServer(token);

          // 포그라운드 메시지 리스너 설정
          setupForegroundListener();
        } else {
          throw new Error('FCM 토큰 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('FCM 토큰 등록 실패:', error);
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
    updateSettings: (newSettings) => {
      set((state) => {
        state.settings = { ...state.settings, ...newSettings };
      });

      // 서버에 설정 동기화
      syncSettingsToServer(get().settings);
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

// 토큰을 서버에 전송하는 함수
const sendTokenToServer = async (token: string): Promise<void> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fcm/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: 실제 인증 토큰 추가
          // 'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          deviceType: 'web',
          userAgent: navigator.userAgent,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('토큰 서버 전송 실패');
    }

    console.log('FCM 토큰 서버 등록 성공');
  } catch (error) {
    console.error('토큰 서버 전송 실패:', error);
    throw error;
  }
};

// 포그라운드 메시지 리스너 설정
const setupForegroundListener = (): void => {
  onMessageListener()
    .then((payload: unknown) => {
      console.log('포그라운드 메시지 수신:', payload);

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
      console.error('포그라운드 메시지 리스너 오류:', error);
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
  // TODO: toast 라이브러리 연동
  console.log('인앱 알림 표시:', notification);

  // 임시로 브라우저 알림으로 대체
  showBrowserNotification(notification);
};

// 서버에 설정 동기화
const syncSettingsToServer = async (
  settings: NotificationSettings,
): Promise<void> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fcm/settings`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: 실제 인증 토큰 추가
          // 'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      },
    );

    if (!response.ok) {
      throw new Error('설정 동기화 실패');
    }

    console.log('알림 설정 서버 동기화 완료');
  } catch (error) {
    console.error('설정 동기화 실패:', error);
  }
};

// FCM 스토어 초기화 함수
export const initializeFCM = async (): Promise<void> => {
  const store = useFCMStore.getState();

  // 브라우저 지원 확인
  if ('Notification' in window && 'serviceWorker' in navigator) {
    useFCMStore.setState({ isSupported: true });

    // 현재 권한 상태 확인
    const permission = Notification.permission as NotificationPermission;
    useFCMStore.setState({ permission });

    // 이미 권한이 있으면 토큰 등록
    if (permission === 'granted') {
      await store.registerToken();
    }
  } else {
    console.warn('FCM이 지원되지 않는 브라우저입니다.');
    useFCMStore.setState({ isSupported: false });
  }
};

// 스토어에 알림 추가 액션 (동적으로 추가)
useFCMStore.setState((state) => ({
  ...state,
  addNotification: (notification: NotificationHistory) => {
    useFCMStore.setState((prevState) => ({
      notifications: [notification, ...prevState.notifications].slice(0, 100), // 최대 100개 유지
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
}));

export default useFCMStore;
