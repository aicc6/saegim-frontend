'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, TrendingUp, X } from 'lucide-react';
import { useFCMStore } from '@/stores/fcm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import NotificationSettings from './notification-settings';

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

        // FCM API를 직접 호출하여 알림 이력 조회
        const { fcmApi } = await import('@/lib/fcm-api');
        const response = await fcmApi.getNotificationHistory(100, 0);

        // 응답 데이터 검증
        if (!response || !response.data || !Array.isArray(response.data)) {
          throw new Error('잘못된 응답 형식입니다.');
        }

        // API 응답을 Notification 타입으로 변환
        const apiNotifications: Notification[] = response.data
          .map((apiNotification, index) => {
            // 필수 필드 검증
            if (!apiNotification.id || !apiNotification.title) {
              console.warn(`알림 데이터 누락: index ${index}`, apiNotification);
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
              isRead: apiNotification.status === 'opened',
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
        console.error('알림 이력 로드 실패:', err);

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              알림 목록 ({isLoading ? '...' : notifications.length})
            </TabsTrigger>
            <TabsTrigger value="settings">알림 설정</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* 필터 */}
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={
                  filter === 'all'
                    ? 'bg-sage-50 hover:bg-sage-60 dark:bg-sage-70 dark:hover:bg-sage-80'
                    : 'border-sage-30 dark:border-gray-600 dark:hover:bg-gray-800'
                }
              >
                전체 ({isLoading ? '...' : notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className={
                  filter === 'unread'
                    ? 'bg-sage-50 hover:bg-sage-60 dark:bg-sage-70 dark:hover:bg-sage-80'
                    : 'border-sage-30 dark:border-gray-600 dark:hover:bg-gray-800'
                }
              >
                읽지 않음 ({isLoading ? '...' : unreadCount})
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
            <div className="space-y-2">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-50"></div>
                    <p className="ml-3 text-sage-70 dark:text-gray-400">
                      {isRetrying ? '재시도 중...' : '알림을 불러오는 중...'}
                    </p>
                  </div>
                  {/* 스켈레톤 로딩 UI */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-sage-20 dark:border-gray-700 p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-sage-20 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-sage-20 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                          <div className="h-3 bg-sage-15 dark:bg-gray-600 rounded animate-pulse w-full"></div>
                          <div className="h-3 bg-sage-15 dark:bg-gray-600 rounded animate-pulse w-2/3"></div>
                        </div>
                        <div className="w-16 h-3 bg-sage-15 dark:bg-gray-600 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative inline-block mb-6">
                    <Bell className="w-16 h-16 text-sage-40 dark:text-gray-500 mx-auto" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-sage-10 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sage-60 dark:text-gray-400 text-xs">
                        ✓
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-sage-90 dark:text-gray-200 mb-2">
                    {filter === 'unread'
                      ? '모든 알림을 확인했습니다!'
                      : '아직 알림이 없어요'}
                  </h3>
                  <p className="text-sage-60 dark:text-gray-400 max-w-sm mx-auto">
                    {filter === 'unread'
                      ? '새로운 알림이 오면 여기에서 확인할 수 있어요'
                      : '다이어리 작성이나 AI 분석 등 중요한 알림을 받아보세요'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification, index) => {
                    const uiElements = getNotificationUIElements(notification);
                    const IconComponent = uiElements.icon;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        className={`group relative w-full text-left bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer ${
                          !notification.isRead
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-sage-20 dark:border-gray-700 hover:border-sage-30 dark:hover:border-gray-600'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: isLoading
                            ? 'none'
                            : 'fadeInUp 0.4s ease-out forwards',
                        }}
                        onClick={() =>
                          !notification.isRead && markAsRead(notification.id)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            !notification.isRead && markAsRead(notification.id);
                          }
                        }}
                        aria-label={`알림: ${notification.title}. ${!notification.isRead ? '읽지 않음' : '읽음'}`}
                      >
                        {/* 읽지 않음 표시선 */}
                        {!notification.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                        )}

                        <div className="p-4 pl-6">
                          <div className="flex items-start space-x-3">
                            {/* 아이콘 */}
                            <div
                              className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                getNotificationDisplayType(
                                  notification.notification_type,
                                ) === 'emotion_report'
                                  ? 'bg-blue-100 dark:bg-blue-900/50'
                                  : 'bg-purple-100 dark:bg-purple-900/50'
                              }`}
                            >
                              <IconComponent
                                className={`w-5 h-5 ${
                                  getNotificationDisplayType(
                                    notification.notification_type,
                                  ) === 'emotion_report'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-purple-600 dark:text-purple-400'
                                }`}
                              />
                              {notification.status !== 'opened' && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3
                                  className={`font-medium text-sm leading-5 ${
                                    notification.status !== 'opened'
                                      ? 'text-sage-100 dark:text-gray-100'
                                      : 'text-sage-80 dark:text-gray-300'
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                <span className="text-xs text-sage-60 dark:text-gray-400 whitespace-nowrap ml-2">
                                  {formatDate(notification.created_at)}
                                </span>
                              </div>

                              <p className="text-sage-70 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                                {notification.body}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {notification.actionUrl && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs border-sage-30 dark:border-gray-600 hover:bg-sage-10 dark:hover:bg-gray-700"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      자세히 보기
                                    </Button>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className={`h-5 text-xs ${uiElements.color} dark:bg-opacity-20`}
                                  >
                                    {uiElements.label}
                                  </Badge>
                                </div>

                                {/* 액션 버튼들 */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {notification.status !== 'opened' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
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
                                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50"
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
