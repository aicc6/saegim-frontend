'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, TrendingUp, X } from 'lucide-react';
import { useFCMStore } from '@/stores/fcm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import { getLogger } from '@/lib/logger';
import NotificationSettings from './notification-settings';

const logger = getLogger('NotificationPage');

// 백엔드 API 응답 타입에 맞춘 알림 인터페이스
interface Notification {
  id: string;
  title: string;
  body: string; // 백엔드는 'body' 사용
  notification_type: string; // 백엔드는 'notification_type' 사용
  status: 'sent' | 'failed' | 'pending' | 'delivered' | 'opened';
  created_at: string; // 백엔드는 'created_at' 사용
  fcm_response?: Record<string, unknown>;
  // 프론트엔드 전용 추가 필드
  isRead?: boolean; // 로컬 읽음 상태 관리용
  actionUrl?: string; // fcm_response.url에서 추출
}

// 알림 타입을 UI 표시용으로 변환하는 함수
const getNotificationDisplayType = (
  notification_type: string,
): 'emotion_report' | 'ai_suggestion' => {
  switch (notification_type) {
    case 'diary_reminder':
    case 'emotion_trend':
      return 'emotion_report';
    case 'ai_content_ready':
    case 'general':
    default:
      return 'ai_suggestion';
  }
};

// FCM 알림 타입을 백엔드 API 타입으로 변환하는 함수
const convertFCMNotificationToBackendFormat = (fcmNotification: {
  id: string;
  type: string;
  title: string;
  body: string;
  sentAt: string;
  isRead: boolean;
  data?: { url?: string };
}): Notification => {
  return {
    id: fcmNotification.id,
    title: fcmNotification.title,
    body: fcmNotification.body,
    notification_type: fcmNotification.type,
    status: 'delivered', // FCM 알림은 전달된 것으로 간주
    created_at: fcmNotification.sentAt,
    fcm_response: fcmNotification.data,
    isRead: fcmNotification.isRead,
    actionUrl: fcmNotification.data?.url,
  };
};

const notificationIcons = {
  emotion_report: TrendingUp,
  ai_suggestion: Sparkles,
};

const notificationColors = {
  emotion_report: 'bg-blue-100 text-blue-800',
  ai_suggestion: 'bg-purple-100 text-purple-800',
};

export function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // FCM store에서 데이터 가져오기
  const {
    notifications: fcmNotifications,
    markAsRead: fcmMarkAsRead,
    markAllAsRead: fcmMarkAllAsRead,
    unreadCount: fcmUnreadCount,
  } = useFCMStore();

  // 컴포넌트 마운트 시 알림 이력을 API에서 로드
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsRetrying(retryCount > 0);

        // Notification API를 직접 호출하여 알림 이력 조회
        const { notificationApi } = await import('@/lib/notification-api');
        const response = await notificationApi.getNotificationHistory(100, 0);

        // 응답 데이터 검증
        if (!response || !response.data || !Array.isArray(response.data)) {
          throw new Error('잘못된 응답 형식입니다.');
        }

        // API 응답을 Notification 타입으로 변환
        const apiNotifications: Notification[] = response.data
          .map((apiNotification, index) => {
            // 필수 필드 검증
            if (!apiNotification.id || !apiNotification.title) {
              logger.warn(`알림 데이터 누락: index ${index}`, {
                apiNotification,
              });
              return null;
            }

            return {
              id: apiNotification.id,
              title: apiNotification.title,
              body: apiNotification.body || '',
              notification_type: apiNotification.notification_type || 'general',
              status: apiNotification.status || 'delivered',
              created_at:
                apiNotification.created_at || new Date().toISOString(),
              fcm_response: apiNotification.fcm_response || {},
              isRead: ['opened', 'read'].includes(apiNotification.status || ''),
              actionUrl:
                (apiNotification.fcm_response?.url as string) || undefined,
            };
          })
          .filter(Boolean) as Notification[];

        // FCM 스토어의 알림과 API 알림을 합치기
        const fcmConverted = fcmNotifications.map(
          convertFCMNotificationToBackendFormat,
        );
        const allNotifications = [...fcmConverted, ...apiNotifications];

        // ID 기준으로 중복 제거
        const uniqueNotifications = allNotifications.filter(
          (notification, index, self) =>
            index === self.findIndex((n) => n.id === notification.id),
        );

        setNotifications(uniqueNotifications);
        setRetryCount(0); // 성공 시 재시도 카운트 리셋
      } catch (err) {
        logger.error('알림 이력 로드 실패', { error: err });

        // 에러 타입에 따른 상세 메시지
        let errorMessage = '알림 이력을 불러올 수 없습니다.';
        if (err instanceof Error) {
          if (err.message.includes('fetch')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
          } else if (
            err.message.includes('400') ||
            err.message.includes('401')
          ) {
            errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
          } else if (err.message.includes('500')) {
            errorMessage =
              '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
          } else if (err.message.includes('timeout')) {
            errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
          }
        }

        setError(errorMessage);

        // 재시도 로직 (최대 3회)
        if (retryCount < 3) {
          setTimeout(
            () => {
              setRetryCount((prev) => prev + 1);
            },
            Math.pow(2, retryCount) * 1000,
          ); // 지수적 백오프 (1초, 2초, 4초)
        } else {
          // 최대 재시도 횟수 초과 시 FCM 알림만 표시
          const convertedNotifications = fcmNotifications.map(
            convertFCMNotificationToBackendFormat,
          );
          setNotifications(convertedNotifications);
        }
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    };

    loadNotifications();
  }, [fcmNotifications, retryCount]);

  // FCM 알림이 변경될 때 실시간 업데이트
  useEffect(() => {
    if (!isLoading) {
      setNotifications((prev) => {
        const fcmConverted = fcmNotifications.map(
          convertFCMNotificationToBackendFormat,
        );
        const nonFcmNotifications = prev.filter(
          (n) => !fcmNotifications.find((fcm) => fcm.id === n.id),
        );
        return [...fcmConverted, ...nonFcmNotifications];
      });
    }
  }, [fcmNotifications, isLoading]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    // FCM 알림인지 확인하고 적절한 액션 호출
    const fcmNotification = fcmNotifications.find((n) => n.id === id);
    if (fcmNotification) {
      fcmMarkAsRead(id);
    } else {
      // 로컬 알림 처리
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    }
  };

  const markAllAsRead = () => {
    // FCM 알림 전체 읽기
    if (fcmUnreadCount > 0) {
      fcmMarkAllAsRead();
    }
    // 로컬 알림 전체 읽기
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 수동 재시도 함수
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 48) return '어제';
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // 알림 타입에 따른 UI 요소 가져오기
  const getNotificationUIElements = (notification: Notification) => {
    const displayType = getNotificationDisplayType(
      notification.notification_type,
    );
    return {
      icon: notificationIcons[displayType],
      color: notificationColors[displayType],
      label: displayType === 'emotion_report' ? '감정 리포트' : 'AI 제안',
    };
  };

  return (
    <div className="min-h-screen bg-sage-10 dark:bg-gray-900">
      {/* PageHeader 사용 */}
      <PageHeader
        title="알림"
        subtitle={
          unreadCount > 0
            ? `${unreadCount}개의 새로운 알림이 있습니다`
            : undefined
        }
        actions={
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="border-sage-30 bg-transparent hover:bg-sage-10 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Check className="w-4 h-4 mr-2" />
                모두 읽음
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-sage-10 dark:bg-gray-800 p-2 rounded-xl border border-sage-20 dark:border-gray-700">
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-sage-90 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-sage-20 dark:data-[state=active]:border-gray-600 text-sage-60 dark:text-gray-400 hover:text-sage-80 dark:hover:text-gray-300 rounded-lg transition-all duration-200 font-medium"
            >
              알림 목록 ({isLoading ? '...' : notifications.length})
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-sage-90 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-sage-20 dark:data-[state=active]:border-gray-600 text-sage-60 dark:text-gray-400 hover:text-sage-80 dark:hover:text-gray-300 rounded-lg transition-all duration-200 font-medium"
            >
              알림 설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* 개선된 필터 */}
            <div className="flex items-center space-x-3 p-1 bg-sage-10/50 dark:bg-gray-800/50 rounded-xl border border-sage-20/50 dark:border-gray-700/50 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('all')}
                className={`relative px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                  filter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-sage-80 dark:text-gray-200 shadow-sm border border-sage-20 dark:border-gray-600'
                    : 'text-sage-60 dark:text-gray-400 hover:text-sage-80 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>전체</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                      filter === 'all'
                        ? 'bg-sage-20 dark:bg-gray-600 text-sage-70 dark:text-gray-300'
                        : 'bg-sage-15 dark:bg-gray-600 text-sage-60 dark:text-gray-400'
                    }`}
                  >
                    {isLoading ? '...' : notifications.length}
                  </span>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('unread')}
                className={`relative px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                  filter === 'unread'
                    ? 'bg-white dark:bg-gray-700 text-sage-80 dark:text-gray-200 shadow-sm border border-sage-20 dark:border-gray-600'
                    : 'text-sage-60 dark:text-gray-400 hover:text-sage-80 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span>읽지 않음</span>
                    {unreadCount > 0 && filter !== 'unread' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                      filter === 'unread'
                        ? unreadCount > 0
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'bg-sage-20 dark:bg-gray-600 text-sage-70 dark:text-gray-300'
                        : unreadCount > 0
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                          : 'bg-sage-15 dark:bg-gray-600 text-sage-60 dark:text-gray-400'
                    }`}
                  >
                    {isLoading ? '...' : unreadCount}
                  </span>
                </div>
              </Button>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <X className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-red-800 dark:text-red-200 font-medium">
                          알림 로드 실패
                        </p>
                        <p className="text-red-600 dark:text-red-300 text-sm">
                          {error}
                        </p>
                        {retryCount > 0 && (
                          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                            재시도 {retryCount}/3회 실행됨
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      {isRetrying ? '재시도 중...' : '다시 시도'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 알림 목록 */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-12">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-sage-20 dark:border-gray-600"></div>
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-sage-60 dark:border-t-sage-40 absolute top-0 left-0 animate-pulse"></div>
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sage-80 dark:text-gray-300 font-medium">
                        {isRetrying ? '재시도 중...' : '알림을 불러오는 중...'}
                      </p>
                      <p className="text-sage-60 dark:text-gray-400 text-sm">
                        잠시만 기다려 주세요
                      </p>
                    </div>
                  </div>

                  {/* 개선된 스켈레톤 로딩 UI */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="relative bg-gradient-to-r from-white to-sage-5 dark:from-gray-800 dark:to-gray-750 rounded-xl border border-sage-20 dark:border-gray-700 p-5 shadow-sm overflow-hidden"
                      style={{
                        animationDelay: `${i * 150}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards',
                      }}
                    >
                      {/* Shimmer 효과 */}
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-gray-600/20 to-transparent"></div>

                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-sage-30 to-sage-40 dark:from-gray-600 dark:to-gray-700 rounded-full animate-pulse"></div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-sage-50 dark:bg-gray-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <div className="h-5 bg-gradient-to-r from-sage-30 to-sage-20 dark:from-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gradient-to-r from-sage-20 to-sage-15 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-full"></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="h-3 bg-sage-15 dark:bg-gray-600 rounded-full animate-pulse w-2/3"></div>
                            <div className="h-6 bg-sage-25 dark:bg-gray-600 rounded-full animate-pulse w-16"></div>
                          </div>
                        </div>
                        <div className="w-20 h-4 bg-sage-15 dark:bg-gray-600 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-8">
                    {/* 배경 그라데이션 원 */}
                    <div className="w-32 h-32 bg-gradient-to-br from-sage-10 via-sage-20 to-sage-30 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-inner">
                        <Bell className="w-12 h-12 text-sage-50 dark:text-gray-400 animate-bounce" />
                      </div>
                    </div>
                    {filter !== 'unread' && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    <h3 className="text-2xl font-bold text-sage-90 dark:text-gray-200 mb-3">
                      {filter === 'unread'
                        ? '🎉 모든 알림을 확인했습니다!'
                        : '📬 아직 알림이 없어요'}
                    </h3>
                    <p className="text-sage-60 dark:text-gray-400 leading-relaxed">
                      {filter === 'unread'
                        ? '새로운 알림이 오면 여기에서 확인할 수 있어요. 잠시 쉬어가세요! 😊'
                        : '다이어리 작성이나 AI 분석 등의 알림을 받으시려면 알림 설정에서 활성화해주세요.'}
                    </p>

                    {filter !== 'unread' && (
                      <div className="pt-4">
                        <button
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sage-50 to-sage-60 dark:from-sage-70 dark:to-sage-80 text-white rounded-full font-medium hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl"
                          onClick={() => {
                            // 알림 설정 탭으로 이동하는 로직 추가할 수 있음
                            const settingsTab = document.querySelector(
                              '[value="settings"]',
                            ) as HTMLElement;
                            settingsTab?.click();
                          }}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          알림 설정하기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification, index) => {
                    const uiElements = getNotificationUIElements(notification);
                    const IconComponent = uiElements.icon;
                    const isUnread = !notification.isRead;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        className={`group relative w-full text-left rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                          isUnread
                            ? 'bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 dark:from-blue-950/40 dark:via-gray-800 dark:to-blue-950/20 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg'
                            : 'bg-gradient-to-r from-white to-sage-5 dark:from-gray-800 dark:to-gray-750 border-sage-20 dark:border-gray-700 hover:border-sage-30 dark:hover:border-gray-600 hover:shadow-md'
                        } hover:scale-[1.02] hover:-translate-y-1`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: isLoading
                            ? 'none'
                            : 'fadeInUp 0.5s ease-out forwards',
                        }}
                        onClick={() =>
                          !notification.isRead && markAsRead(notification.id)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                          }
                        }}
                        aria-label={`알림: ${notification.title}. ${isUnread ? '읽지 않음' : '읽음'}`}
                      >
                        {/* 읽지 않음 표시선 - 더 두껍고 그라데이션 */}
                        {isUnread && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-l-xl"></div>
                        )}

                        {/* 배경 패턴 효과 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative p-5 pl-7">
                          <div className="flex items-start space-x-4">
                            {/* 개선된 아이콘 */}
                            <div className="relative flex-shrink-0">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                                  getNotificationDisplayType(
                                    notification.notification_type,
                                  ) === 'emotion_report'
                                    ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/40'
                                    : 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/60 dark:to-purple-800/40'
                                }`}
                              >
                                <IconComponent
                                  className={`w-6 h-6 ${
                                    getNotificationDisplayType(
                                      notification.notification_type,
                                    ) === 'emotion_report'
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-purple-600 dark:text-purple-400'
                                  }`}
                                />
                              </div>

                              {isUnread && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3
                                  className={`font-semibold text-base leading-6 pr-2 ${
                                    isUnread
                                      ? 'text-sage-100 dark:text-gray-100'
                                      : 'text-sage-80 dark:text-gray-300'
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                <div className="flex flex-col items-end space-y-1">
                                  <span className="text-xs text-sage-60 dark:text-gray-400 whitespace-nowrap font-medium">
                                    {formatDate(notification.created_at)}
                                  </span>
                                  {isUnread && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                              </div>

                              <p className="text-sage-70 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                                {notification.body}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Badge
                                    variant="secondary"
                                    className={`h-6 text-xs px-3 font-medium ${uiElements.color} dark:bg-opacity-20 shadow-sm`}
                                  >
                                    {uiElements.label}
                                  </Badge>

                                  {notification.actionUrl && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-3 border-sage-30 dark:border-gray-600 hover:bg-sage-10 dark:hover:bg-gray-700 transition-all duration-200"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      자세히 보기 →
                                    </Button>
                                  )}
                                </div>

                                {/* 개선된 액션 버튼들 */}
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                                  {isUnread && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 w-9 p-0 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 transition-all duration-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      title="읽음으로 표시"
                                    >
                                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/50 transition-all duration-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    title="삭제"
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
