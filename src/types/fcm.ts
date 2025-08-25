// FCM 푸시 알림 관련 타입 정의

import type { EmotionType } from './index';

// FCM 메시지 페이로드 타입
export interface FCMPayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
    icon?: string;
  };
  data?: {
    [key: string]: string;
  };
}

// 새김 특화 알림 타입
export type NotificationType =
  | 'diary_reminder' // 다이어리 작성 리마인더
  | 'ai_content_ready' // AI 콘텐츠 생성 완료
  | 'emotion_trend' // 감정 트렌드 분석
  | 'anniversary' // 기념일 알림
  | 'friend_share' // 친구 공유 (향후 기능)
  | 'general'; // 일반 알림

// 새김 알림 데이터 인터페이스
export interface SaeGimNotificationData {
  type: NotificationType;
  emotion?: EmotionType;
  diaryId?: string;
  userId?: string;
  url?: string; // 클릭 시 이동할 URL
  timestamp?: string;
  metadata?: {
    [key: string]: string | number | boolean;
  };
}

// 알림 권한 상태
export type NotificationPermission = 'default' | 'granted' | 'denied';

// 알림 설정 인터페이스
export interface NotificationSettings {
  enabled: boolean;
  diaryReminder: boolean;
  aiContentReady: boolean;
  emotionTrend: boolean;
  anniversary: boolean;
  friendShare: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm 형식
    endTime: string; // HH:mm 형식
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

// FCM 토큰 인터페이스
export interface FCMToken {
  token: string;
  deviceType: 'web' | 'mobile';
  userAgent: string;
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
}

// 알림 히스토리 인터페이스
export interface NotificationHistory {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  emotion?: EmotionType;
  data?: SaeGimNotificationData;
  sentAt: string;
  readAt?: string;
  clickedAt?: string;
  isRead: boolean;
  isClicked: boolean;
}

// 알림 템플릿 인터페이스
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  emotion?: EmotionType;
}

// FCM 스토어 상태 인터페이스
export interface FCMState {
  // 토큰 관리
  token: string | null;
  isTokenRegistered: boolean;

  // 권한 상태
  permission: NotificationPermission;
  isSupported: boolean;

  // 설정
  settings: NotificationSettings;

  // 알림 히스토리
  notifications: NotificationHistory[];
  unreadCount: number;

  // UI 상태
  isLoading: boolean;
  error: string | null;

  // 액션
  requestPermission: () => Promise<boolean>;
  registerToken: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  addNotification?: (notification: NotificationHistory) => void;
  markAsClicked?: (notificationId: string) => void;
}

// API 응답 타입
export interface FCMTokenResponse {
  success: boolean;
  message: string;
  data?: {
    tokenId: string;
    isNewToken: boolean;
  };
}

export interface NotificationSendRequest {
  tokens: string[];
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data: SaeGimNotificationData;
  options?: {
    priority?: 'high' | 'normal';
    timeToLive?: number;
    collapseKey?: string;
  };
}

export interface NotificationSendResponse {
  success: boolean;
  message: string;
  data?: {
    successCount: number;
    failureCount: number;
    results: Array<{
      messageId?: string;
      error?: string;
    }>;
  };
}

// 에러 타입
export interface FCMError {
  code: string;
  message: string;
  details?: {
    [key: string]: unknown;
  };
}

// 감정별 알림 스타일 매핑
export const EMOTION_NOTIFICATION_STYLES = {
  happy: {
    color: '#FFD700',
    icon: '/images/emotions/happy.png',
    sound: 'happy_notification.mp3',
  },
  sad: {
    color: '#87CEEB',
    icon: '/images/emotions/sad.png',
    sound: 'gentle_notification.mp3',
  },
  angry: {
    color: '#FF6B6B',
    icon: '/images/emotions/angry.png',
    sound: 'calm_notification.mp3',
  },
  peaceful: {
    color: '#98FB98',
    icon: '/images/emotions/peaceful.png',
    sound: 'peaceful_notification.mp3',
  },
  unrest: {
    color: '#DDA0DD',
    icon: '/images/emotions/unrest.png',
    sound: 'supportive_notification.mp3',
  },
} as const;

// 알림 타입별 기본 템플릿
export const DEFAULT_NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  NotificationTemplate
> = {
  diary_reminder: {
    type: 'diary_reminder',
    title: '오늘 하루는 어떠셨나요?',
    body: '새김에서 감정을 기록해보세요. 소중한 순간들을 놓치지 마세요.',
    icon: '/images/logo.webp',
  },
  ai_content_ready: {
    type: 'ai_content_ready',
    title: 'AI 글귀가 준비되었어요',
    body: '당신의 감정에 맞는 특별한 글귀를 확인해보세요.',
    icon: '/images/logo.webp',
  },
  emotion_trend: {
    type: 'emotion_trend',
    title: '이번 주 감정 리포트',
    body: '당신의 감정 패턴을 분석한 인사이트를 확인해보세요.',
    icon: '/images/logo.webp',
  },
  anniversary: {
    type: 'anniversary',
    title: '특별한 날을 기억해요',
    body: '새김과 함께한 소중한 순간을 되돌아보세요.',
    icon: '/images/logo.webp',
  },
  friend_share: {
    type: 'friend_share',
    title: '친구가 감정을 공유했어요',
    body: '친구의 새로운 이야기를 확인해보세요.',
    icon: '/images/logo.webp',
  },
  general: {
    type: 'general',
    title: '새김 알림',
    body: '새로운 알림이 도착했습니다.',
    icon: '/images/logo.webp',
  },
} as const;
