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
import { 
  fcmApi, 
  type FCMTokenRegisterRequest,
  type NotificationSettingsUpdate 
} from '../lib/fcm-api';

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
          // 백엔드 API를 통해 토큰 등록
          const tokenData: FCMTokenRegisterRequest = {
            token,
            device_type: 'web',
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
            }
          };

          const response = await fcmApi.registerToken(tokenData);
          
          if (response.success) {
            set((state) => {
              state.token = token;
              state.isTokenRegistered = true;
              state.isLoading = false;
            });

            // 포그라운드 메시지 리스너 설정
            setupForegroundListener();
            
            console.log('FCM 토큰 등록 성공:', response.data);
          } else {
            throw new Error(response.message || 'FCM 토큰 등록에 실패했습니다.');
          }
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
    updateSettings: async (newSettings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // 백엔드 API 스키마에 맞게 설정 변환
        const backendSettings: NotificationSettingsUpdate = {
          diary_reminder: newSettings.diaryReminder,
          ai_content_ready: newSettings.aiContentReady,
          weekly_report: newSettings.emotionTrend, // 임시 매핑
          marketing: newSettings.friendShare, // 임시 매핑
          quiet_hours_start: newSettings.quietHours?.enabled ? newSettings.quietHours.startTime : null,
          quiet_hours_end: newSettings.quietHours?.enabled ? newSettings.quietHours.endTime : null,
        };

        const response = await fcmApi.updateNotificationSettings(backendSettings);
        
        if (response.success) {
          set((state) => {
            state.settings = { ...state.settings, ...newSettings };
            state.isLoading = false;
          });
          
          console.log('알림 설정 업데이트 성공:', response.data);
        } else {
          throw new Error(response.message || '알림 설정 업데이트에 실패했습니다.');
        }
      } catch (error) {
        console.error('알림 설정 업데이트 실패:', error);
        set((state) => {
          state.error = error instanceof Error 
            ? error.message 
            : '알림 설정 업데이트에 실패했습니다.';
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

// 백엔드에서 알림 설정을 가져와 프론트엔드 설정과 동기화하는 함수
const syncSettingsFromServer = async (): Promise<NotificationSettings | null> => {
  try {
    const response = await fcmApi.getNotificationSettings();
    
    if (response.success && response.data) {
      const serverSettings = response.data;
      
      // 백엔드 스키마를 프론트엔드 스키마로 변환
      const frontendSettings: NotificationSettings = {
        enabled: true, // 기본적으로 활성화
        diaryReminder: serverSettings.diary_reminder,
        aiContentReady: serverSettings.ai_content_ready,
        emotionTrend: serverSettings.weekly_report, // 임시 매핑
        anniversary: true, // 백엔드에 없는 필드, 기본값
        friendShare: serverSettings.marketing, // 임시 매핑
        quietHours: {
          enabled: !!(serverSettings.quiet_hours_start && serverSettings.quiet_hours_end),
          startTime: serverSettings.quiet_hours_start || '22:00',
          endTime: serverSettings.quiet_hours_end || '08:00',
        },
        frequency: 'immediate', // 백엔드에 없는 필드, 기본값
      };
      
      return frontendSettings;
    }
    
    return null;
  } catch (error) {
    console.error('서버에서 알림 설정 조회 실패:', error);
    return null;
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

// 사용자 토큰 목록 조회 함수
const getUserTokens = async () => {
  try {
    const response = await fcmApi.getTokens();
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('사용자 토큰 목록 조회 실패:', error);
    return [];
  }
};

// 토큰 삭제 함수
const deleteUserToken = async (tokenId: string) => {
  try {
    const response = await fcmApi.deleteToken(tokenId);
    if (response.success) {
      console.log('토큰 삭제 성공:', tokenId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
    return false;
  }
};

// 알림 히스토리 조회 함수
const getNotificationHistory = async (limit: number = 20, offset: number = 0) => {
  try {
    const response = await fcmApi.getNotificationHistory(limit, offset);
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('알림 히스토리 조회 실패:', error);
    return [];
  }
};

// FCM 스토어 초기화 함수
export const initializeFCM = async (): Promise<void> => {
  const store = useFCMStore.getState();

  console.log('FCM 스토어 초기화 시작...');

  // 브라우저 지원 확인
  if ('Notification' in window && 'serviceWorker' in navigator) {
    console.log('브라우저가 FCM을 지원합니다.');
    useFCMStore.setState({ isSupported: true });

    // Service Worker 등록 확인
    try {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        console.log('Service Worker를 등록합니다...');
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker 등록 완료');
      } else {
        console.log('Service Worker가 이미 등록되어 있습니다.');
      }
    } catch (error) {
      console.error('Service Worker 등록 실패:', error);
    }

    // 현재 권한 상태 확인
    const permission = Notification.permission as NotificationPermission;
    useFCMStore.setState({ permission });
    console.log('현재 알림 권한 상태:', permission);

    // 백엔드에서 알림 설정 동기화
    const serverSettings = await syncSettingsFromServer();
    if (serverSettings) {
      useFCMStore.setState({ settings: serverSettings });
      console.log('서버 알림 설정 동기화 완료');
    }

    // 이미 권한이 있으면 토큰 등록
    if (permission === 'granted') {
      console.log('알림 권한이 이미 허용되어 있어 토큰 등록을 시도합니다.');
      await store.registerToken();
    }
  } else {
    console.warn('FCM이 지원되지 않는 브라우저입니다.');
    useFCMStore.setState({ isSupported: false });
  }

  console.log('FCM 스토어 초기화 완료');
};

// 스토어에 알림 추가 액션 (동적으로 추가)
// 스토어에 추가 액션들을 동적으로 추가
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
  
  // 토큰 관리 관련 추가 액션들
  getUserTokens,
  deleteToken: deleteUserToken,
  
  // 알림 히스토리 관련 액션들
  loadNotificationHistory: getNotificationHistory,
  
  // FCM 서비스 상태 확인
  checkFCMHealth: async () => {
    try {
      const response = await fcmApi.checkHealth();
      return response.success;
    } catch (error) {
      console.error('FCM 서비스 상태 확인 실패:', error);
      return false;
    }
  },
}));

export default useFCMStore;
