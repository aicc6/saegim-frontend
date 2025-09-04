'use client';

import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';

// 알림 타입 정의
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// 알림 생성 인터페이스
interface CreateNotificationParams {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// 훅 반환 타입
interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (params: CreateNotificationParams) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// 로컬 스토리지 키
const STORAGE_KEY = 'saegim_notifications';

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 로컬 스토리지에서 알림 데이터 로드
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // timestamp를 Date 객체로 변환
          const converted = parsed.map(
            (notification: {
              id: string;
              title: string;
              message: string;
              timestamp: string;
              type: string;
              isRead: boolean;
              [key: string]: unknown;
            }) => ({
              ...notification,
              timestamp: new Date(notification.timestamp),
            }),
          );
          setNotifications(converted);
        } else {
          // 빈 배열로 초기화
          setNotifications([]);
        }
      } catch (error) {
        logger.error('Failed to load notifications:', error);
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  // 로컬 스토리지에 알림 데이터 저장
  const saveToStorage = useCallback((updatedNotifications: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
    } catch (error) {
      logger.error('Failed to save notifications:', error);
    }
  }, []);

  // 새 알림 추가
  const addNotification = useCallback(
    (params: CreateNotificationParams) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: params.title,
        message: params.message,
        timestamp: new Date(),
        isRead: false,
        type: params.type || 'info',
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  // 알림을 읽음으로 표시
  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification,
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  // 모든 알림을 읽음으로 표시
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((notification) => ({
        ...notification,
        isRead: true,
      }));
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // 알림 삭제
  const deleteNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((notification) => notification.id !== id);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  // 모든 알림 삭제
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveToStorage([]);
  }, [saveToStorage]);

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  };
}
