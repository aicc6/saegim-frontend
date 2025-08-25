'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Settings,
  Check,
  Trash2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useFCMStore } from '@/stores/fcm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import NotificationSettings from './notification-settings';

interface Notification {
  id: string;
  type: 'emotion_report' | 'ai_suggestion';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  actionUrl?: string;
}

// FCM 알림 타입을 로컬 알림 타입으로 변환하는 함수
const convertFCMNotificationToLocal = (fcmNotification: any): Notification => {
  // FCM 알림 타입을 로컬 타입으로 매핑
  const getLocalType = (fcmType: string): 'emotion_report' | 'ai_suggestion' => {
    switch (fcmType) {
      case 'diary':
      case 'emotion':
      case 'report':
        return 'emotion_report';
      case 'ai':
      case 'suggestion':
      default:
        return 'ai_suggestion';
    }
  };

  return {
    id: fcmNotification.id,
    type: getLocalType(fcmNotification.type),
    title: fcmNotification.title,
    message: fcmNotification.body,
    date: fcmNotification.sentAt,
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
  
  // FCM store에서 데이터 가져오기
  const { 
    notifications: fcmNotifications, 
    markAsRead: fcmMarkAsRead, 
    markAllAsRead: fcmMarkAllAsRead,
    unreadCount: fcmUnreadCount,
    loadNotificationHistory 
  } = useFCMStore();

  // 컴포넌트 마운트 시 알림 이력을 API에서 로드
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // API에서 알림 이력 조회 (최대 100개)
        const apiNotifications = await loadNotificationHistory?.(100, 0) || [];
        
        // API 알림을 로컬 알림 형태로 변환
        const convertedApiNotifications: Notification[] = apiNotifications.map((apiNotification: any) => ({
          id: apiNotification.id,
          type: apiNotification.notification_type === 'diary_reminder' ? 'emotion_report' : 'ai_suggestion',
          title: apiNotification.title,
          message: apiNotification.body || apiNotification.content,
          date: apiNotification.sent_at,
          isRead: apiNotification.is_read || false,
          actionUrl: apiNotification.data_payload?.url,
        }));
        
        // FCM 스토어의 알림과 API 알림을 합치기 (중복 제거)
        const fcmConverted = fcmNotifications.map(convertFCMNotificationToLocal);
        const allNotifications = [...fcmConverted, ...convertedApiNotifications];
        
        // ID 기준으로 중복 제거
        const uniqueNotifications = allNotifications.filter((notification, index, self) => 
          index === self.findIndex(n => n.id === notification.id)
        );
        
        setNotifications(uniqueNotifications);
      } catch (err) {
        console.error('알림 이력 로드 실패:', err);
        setError('알림 이력을 불러올 수 없습니다.');
        
        // 에러 시 FCM 알림만 표시
        const convertedNotifications = fcmNotifications.map(convertFCMNotificationToLocal);
        setNotifications(convertedNotifications);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [fcmNotifications, loadNotificationHistory]);

  // FCM 알림이 변경될 때 실시간 업데이트
  useEffect(() => {
    if (!isLoading) {
      setNotifications(prev => {
        const fcmConverted = fcmNotifications.map(convertFCMNotificationToLocal);
        const nonFcmNotifications = prev.filter(n => !fcmNotifications.find(fcm => fcm.id === n.id));
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
            <Button
              variant="outline"
              size="sm"
              className="border-sage-30 bg-transparent hover:bg-sage-10 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              알림 목록 ({isLoading ? '...' : notifications.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              알림 설정
            </TabsTrigger>
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
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-800 text-sm">⚠️ {error}</p>
                </CardContent>
              </Card>
            )}

            {/* 알림 목록 */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-sage-20 dark:border-gray-700 p-4">
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
                      <span className="text-sage-60 dark:text-gray-400 text-xs">✓</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-sage-90 dark:text-gray-200 mb-2">
                    {filter === 'unread' ? '모든 알림을 확인했습니다!' : '아직 알림이 없어요'}
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
                    const IconComponent = notificationIcons[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className={`group relative bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer ${
                          !notification.isRead
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-sage-20 dark:border-gray-700 hover:border-sage-30 dark:hover:border-gray-600'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: isLoading ? 'none' : 'fadeInUp 0.4s ease-out forwards'
                        }}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        {/* 읽지 않음 표시선 */}
                        {!notification.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                        )}
                        
                        <div className="p-4 pl-6">
                          <div className="flex items-start space-x-3">
                            {/* 아이콘 */}
                            <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              notification.type === 'emotion_report' 
                                ? 'bg-blue-100 dark:bg-blue-900/50' 
                                : 'bg-purple-100 dark:bg-purple-900/50'
                            }`}>
                              <IconComponent className={`w-5 h-5 ${
                                notification.type === 'emotion_report' 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-purple-600 dark:text-purple-400'
                              }`} />
                              {!notification.isRead && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className={`font-medium text-sm leading-5 ${
                                  !notification.isRead 
                                    ? 'text-sage-100 dark:text-gray-100' 
                                    : 'text-sage-80 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </h3>
                                <span className="text-xs text-sage-60 dark:text-gray-400 whitespace-nowrap ml-2">
                                  {formatDate(notification.date)}
                                </span>
                              </div>
                              
                              <p className="text-sage-70 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                                {notification.message}
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
                                    className={`h-5 text-xs ${notificationColors[notification.type]} dark:bg-opacity-20`}
                                  >
                                    {notification.type === 'emotion_report' ? '감정 리포트' : 'AI 제안'}
                                  </Badge>
                                </div>
                                
                                {/* 액션 버튼들 */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notification.isRead && (
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
                      </div>
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
