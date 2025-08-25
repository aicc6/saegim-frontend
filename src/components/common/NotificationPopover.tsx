'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

// 알림 타입 정의
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// FCM 알림 타입
interface FCMNotification {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  isRead: boolean;
  type: string;
}

interface NotificationPopoverProps {
  notifications: Notification[];
  fcmNotifications?: FCMNotification[];
  fcmUnreadCount?: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onFCMMarkAsRead?: (id: string) => void;
  onFCMMarkAllAsRead?: () => void;
}

export default function NotificationPopover({
  notifications,
  fcmNotifications = [],
  fcmUnreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onFCMMarkAsRead,
  onFCMMarkAllAsRead,
}: NotificationPopoverProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const localUnreadCount = unreadNotifications.length;
  
  // FCM 읽지 않은 알림 우선적으로 사용
  const totalUnreadCount = fcmUnreadCount || localUnreadCount;
  
  // FCM 알림을 로컬 알림 형태로 변환
  const convertedFCMNotifications: Notification[] = fcmNotifications.map((fcm) => ({
    id: `fcm_${fcm.id}`,
    title: fcm.title,
    message: fcm.body,
    timestamp: new Date(fcm.sentAt),
    isRead: fcm.isRead,
    type: fcm.type === 'diary' ? 'info' : 'info' as 'info' | 'success' | 'warning' | 'error',
  }));
  
  // 모든 알림 합치기 (FCM 알림을 우선으로)
  const allNotifications = [...convertedFCMNotifications, ...notifications]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const getTypeColor = (type: string = 'info') => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return isDark ? 'text-blue-400' : 'text-blue-600';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={`p-2 ${
              isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-sage-70 hover:text-sage-100 hover:bg-sage-10'
            }`}
          >
            <Bell className="w-5 h-5" />
          </Button>
          {totalUnreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 p-0 text-[10px] bg-red-500 text-white border-white border-[1px] flex items-center justify-center rounded-full">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={`w-80 p-0 ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h3
            className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            알림 {totalUnreadCount > 0 && `(${totalUnreadCount})`}
          </h3>
          {totalUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // FCM 알림이 있으면 FCM 전체 읽기, 없으면 로컬 전체 읽기
                if (fcmUnreadCount > 0 && onFCMMarkAllAsRead) {
                  onFCMMarkAllAsRead();
                } else {
                  onMarkAllAsRead();
                }
              }}
              className={`text-xs ${
                isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              전체 읽기
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell
                className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
              />
              <p
                className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                새로운 알림이 없습니다.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className={`text-xs ${
                  isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                전체 알림 보기
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {allNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !notification.isRead
                      ? isDark
                        ? 'bg-gray-700/50'
                        : 'bg-blue-50'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.isRead
                              ? 'bg-blue-500'
                              : isDark
                                ? 'bg-gray-600'
                                : 'bg-gray-300'
                          }`}
                        />
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-medium ${getTypeColor(notification.type)} ${isDark ? '' : 'text-gray-900'}`}
                          >
                            {notification.title}
                          </h4>
                          <p
                            className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                          >
                            {notification.message}
                          </p>
                          <p
                            className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // FCM 알림인지 확인해서 적절한 액션 호출
                            if (notification.id.startsWith('fcm_') && onFCMMarkAsRead) {
                              const fcmId = notification.id.replace('fcm_', '');
                              onFCMMarkAsRead(fcmId);
                            } else {
                              onMarkAsRead(notification.id);
                            }
                          }}
                          className={`p-1 h-6 w-6 ${
                            isDark
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteNotification(notification.id)}
                        className={`p-1 h-6 w-6 ${
                          isDark
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600'
                            : 'text-gray-500 hover:text-red-600 hover:bg-gray-200'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {allNotifications.length > 0 && (
          <>
            <Separator className="dark:border-gray-600" />
            <div className="p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className={`text-xs ${
                  isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                모든 알림 보기
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
