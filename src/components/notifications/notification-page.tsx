'use client';

import { useState } from 'react';
import {
  Bell,
  Settings,
  Check,
  Trash2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/common/PageHeader';

interface Notification {
  id: string;
  type: 'emotion_report' | 'ai_suggestion';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  actionUrl?: string;
}

const notificationIcons = {
  emotion_report: TrendingUp,
  ai_suggestion: Sparkles,
};

const notificationColors = {
  emotion_report: 'bg-blue-100 text-blue-800',
  ai_suggestion: 'bg-purple-100 text-purple-800',
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'emotion_report',
    title: '1월 감정 리포트가 준비되었습니다',
    message:
      '이번 달 가장 많이 느낀 감정은 "평온"이었어요. 자세한 분석을 확인해보세요.',
    date: '2025-01-16T09:00:00Z',
    isRead: false,
    actionUrl: '/report',
  },
  {
    id: '2',
    type: 'ai_suggestion',
    title: '새로운 AI 글귀 스타일 추천',
    message:
      '최근 작성하신 키워드를 바탕으로 "힐링" 스타일의 글귀를 추천드려요.',
    date: '2025-01-15T14:30:00Z',
    isRead: false,
  },
  {
    id: '5',
    type: 'ai_suggestion',
    title: 'AI가 분석한 감정 패턴',
    message:
      '최근 일주일간 "행복" 감정이 증가하는 추세예요. 긍정적인 변화가 감지됩니다!',
    date: '2025-01-13T16:45:00Z',
    isRead: true,
  },
];

export function NotificationPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllAsRead = () => {
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
              <Badge className="bg-red-500 text-white mr-2">
                {unreadCount}
              </Badge>
            )}
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
        {/* 필터 */}
        <div className="mb-6">
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
              전체 ({notifications.length})
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
              읽지 않음 ({unreadCount})
            </Button>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-sage-60 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-sage-80 mb-2">
                  {filter === 'unread'
                    ? '읽지 않은 알림이 없습니다'
                    : '알림이 없습니다'}
                </h3>
                <p className="text-sage-60">
                  {filter === 'unread'
                    ? '모든 알림을 확인하셨네요!'
                    : '새로운 알림이 오면 여기에 표시됩니다.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = notificationIcons[notification.type];
              return (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead
                      ? 'border-sage-50 bg-sage-5'
                      : 'border-sage-20'
                  }`}
                  onClick={() =>
                    !notification.isRead && markAsRead(notification.id)
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationColors[notification.type]}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3
                            className={`font-medium ${!notification.isRead ? 'text-sage-100' : 'text-sage-80'}`}
                          >
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-sage-50 rounded-full"></div>
                            )}
                            <span className="text-xs text-sage-60 whitespace-nowrap">
                              {formatDate(notification.date)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sage-70 text-sm leading-relaxed mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          {notification.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-sage-30 bg-transparent"
                            >
                              자세히 보기
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-sage-60 hover:text-red-600 ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* 알림 설정 안내 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sage-100 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-sage-70">
              <div className="flex items-center justify-between">
                <span>감정 리포트 알림</span>
                <Badge variant="secondary" className="bg-sage-20 text-sage-80">
                  활성
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AI 추천 알림</span>
                <Badge variant="secondary" className="bg-sage-20 text-sage-80">
                  활성
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>이메일 알림</span>
                <Badge variant="secondary" className="bg-sage-20 text-sage-80">
                  비활성
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Push 알림</span>
                <Badge variant="secondary" className="bg-sage-20 text-sage-80">
                  활성
                </Badge>
              </div>
            </div>
            <Button className="w-full mt-4 bg-sage-50 hover:bg-sage-60 text-white">
              알림 설정 변경
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
