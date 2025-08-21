'use client';

import { useState, useCallback, useEffect } from 'react';

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

// 초기 더미 데이터 (개발용)
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: '새로운 기능 업데이트',
    message: '일기 작성 기능이 개선되었습니다. 새로운 템플릿을 확인해보세요.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
    isRead: false,
    type: 'info',
  },
  {
    id: '2',
    title: '일기 작성 완료',
    message: '오늘의 일기가 성공적으로 저장되었습니다.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
    isRead: false,
    type: 'success',
  },
  {
    id: '3',
    title: '백업 알림',
    message: '데이터 백업이 완료되었습니다.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
    isRead: true,
    type: 'info',
  },
];

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
          const converted = parsed.map((notification: any) => ({
            ...notification,
            timestamp: new Date(notification.timestamp),
          }));
          setNotifications(converted);
        } else {
          // 초기 더미 데이터 설정 (개발용)
          setNotifications(initialNotifications);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNotifications));
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifications(initialNotifications);
      }
    };

    loadNotifications();
  }, []);

  // 로컬 스토리지에 알림 데이터 저장
  const saveToStorage = useCallback((updatedNotifications: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
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

      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // 알림을 읽음으로 표시
  const markAsRead = useCallback(
    (id: string) => {
      setNotifications(prev => {
        const updated = prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // 모든 알림을 읽음으로 표시
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({
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
      setNotifications(prev => {
        const updated = prev.filter(notification => notification.id !== id);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // 모든 알림 삭제
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveToStorage([]);
  }, [saveToStorage]);

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter(n => !n.isRead).length;

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