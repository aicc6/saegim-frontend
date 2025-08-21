// FCM 푸시 알림 테스트 및 관리 컴포넌트

'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { useFCMStore, initializeFCM } from '../../stores/fcm';

export default function FCMManager() {
  const {
    token,
    isTokenRegistered,
    permission,
    isSupported,
    settings,
    notifications,
    unreadCount,
    isLoading,
    error,
    requestPermission,
    registerToken,
    updateSettings,
    markAllAsRead,
    clearHistory,
  } = useFCMStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // FCM 초기화
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFCM();
        setIsInitialized(true);
      } catch (error) {
        console.error('FCM 초기화 실패:', error);
      }
    };

    initialize();
  }, []);

  // 권한 상태에 따른 아이콘 및 색상
  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { icon: CheckCircle, color: 'text-green-600', text: '허용됨' };
      case 'denied':
        return { icon: XCircle, color: 'text-red-600', text: '거부됨' };
      default:
        return { icon: Bell, color: 'text-yellow-600', text: '미설정' };
    }
  };

  const {
    icon: PermissionIcon,
    color,
    text: permissionText,
  } = getPermissionStatus();

  // 테스트 알림 전송
  const sendTestNotification = async () => {
    if (!token) {
      alert('먼저 알림 권한을 허용하고 토큰을 등록해주세요.');
      return;
    }

    try {
      // 테스트용 브라우저 알림
      if (Notification.permission === 'granted') {
        new Notification('새김 테스트 알림', {
          body: 'FCM 푸시 알림이 정상적으로 작동합니다! 🎉',
          icon: '/images/logo.webp',
          badge: '/images/logo.webp',
          tag: 'test',
          requireInteraction: true,
        });
      }
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      alert('테스트 알림 전송에 실패했습니다.');
    }
  };

  if (!isInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
          <span className="ml-2">FCM 초기화 중...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* FCM 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            FCM 푸시 알림 상태
          </CardTitle>
          <CardDescription>
            새김 앱의 푸시 알림 기능 상태를 확인하고 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 지원 여부 */}
          <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
            <span className="font-medium">브라우저 지원</span>
            <Badge variant={isSupported ? 'default' : 'destructive'}>
              {isSupported ? '지원됨' : '지원 안됨'}
            </Badge>
          </div>

          {/* 권한 상태 */}
          <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
            <span className="font-medium">알림 권한</span>
            <div className="flex items-center gap-2">
              <PermissionIcon className={`h-4 w-4 ${color}`} />
              <Badge
                variant={permission === 'granted' ? 'default' : 'secondary'}
              >
                {permissionText}
              </Badge>
            </div>
          </div>

          {/* 토큰 등록 상태 */}
          <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
            <span className="font-medium">토큰 등록</span>
            <Badge variant={isTokenRegistered ? 'default' : 'secondary'}>
              {isTokenRegistered ? '등록됨' : '미등록'}
            </Badge>
          </div>

          {/* 토큰 표시 */}
          {token && (
            <div className="p-3 bg-background-secondary rounded-lg">
              <span className="font-medium block mb-2">FCM 토큰</span>
              <code className="text-xs bg-background-primary p-2 rounded break-all block">
                {token}
              </code>
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 액션 버튼들 */}
      <Card>
        <CardHeader>
          <CardTitle>FCM 관리 액션</CardTitle>
          <CardDescription>
            푸시 알림 기능을 테스트하고 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 권한 요청 */}
            <Button
              onClick={requestPermission}
              disabled={isLoading || permission === 'granted'}
              variant={permission === 'granted' ? 'secondary' : 'default'}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {permission === 'granted' ? '권한 허용됨' : '권한 요청'}
            </Button>

            {/* 토큰 등록 */}
            <Button
              onClick={registerToken}
              disabled={isLoading || !isSupported || permission !== 'granted'}
              variant={isTokenRegistered ? 'secondary' : 'default'}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isTokenRegistered ? '토큰 등록됨' : '토큰 등록'}
            </Button>

            {/* 테스트 알림 */}
            <Button
              onClick={sendTestNotification}
              disabled={!isTokenRegistered || permission !== 'granted'}
              variant="outline"
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              테스트 알림
            </Button>

            {/* 모든 알림 읽음 */}
            <Button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              모두 읽음 ({unreadCount})
            </Button>

            {/* 히스토리 삭제 */}
            <Button
              onClick={clearHistory}
              disabled={notifications.length === 0}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              히스토리 삭제
            </Button>

            {/* 알림 설정 토글 */}
            <Button
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              variant={settings.enabled ? 'default' : 'secondary'}
              className="w-full"
            >
              {settings.enabled ? (
                <Bell className="h-4 w-4 mr-2" />
              ) : (
                <BellOff className="h-4 w-4 mr-2" />
              )}
              알림 {settings.enabled ? '켜짐' : '꺼짐'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 알림 히스토리 */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>알림 히스토리</span>
              <Badge variant="secondary">{notifications.length}개</Badge>
            </CardTitle>
            <CardDescription>
              최근 수신한 푸시 알림들을 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.isRead
                      ? 'bg-background-secondary'
                      : 'bg-sage-50 border-sage-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-text-secondary mt-1">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        {notification.emotion && (
                          <Badge variant="secondary" className="text-xs">
                            {notification.emotion}
                          </Badge>
                        )}
                        <span className="text-xs text-text-secondary">
                          {new Date(notification.sentAt).toLocaleString(
                            'ko-KR',
                          )}
                        </span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-sage-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 개발자 정보 */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-text-secondary">
            <p>
              🚀 <strong>개발자 모드:</strong> FCM 푸시 알림 테스트 환경
            </p>
            <p className="mt-1">
              실제 서비스에서는 백엔드 API를 통해 알림이 발송됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
