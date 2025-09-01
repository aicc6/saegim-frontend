'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  Activity,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFCMStore, initializeFCM } from '@/stores/fcm';
import { notificationApi } from '@/lib/api/notification';
import { getLogger } from '@/lib/logger';

const logger = getLogger('UnifiedFCMPanel');

/**
 * 통합된 FCM 테스트 및 관리 패널 컴포넌트
 * 기존의 FCMTestPanel과 FCMManager를 하나로 통합하여 중복을 제거
 */
export default function UnifiedFCMPanel() {
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

  const [testResults, setTestResults] = useState<{
    health: boolean | null;
    tokenRegistration: boolean | null;
    settingsSync: boolean | null;
    notificationSend: boolean | null;
  }>({
    health: null,
    tokenRegistration: null,
    settingsSync: null,
    notificationSend: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // 컴포넌트 마운트 시 FCM 초기화
  useEffect(() => {
    const init = async () => {
      try {
        await initializeFCM();
        setIsInitialized(true);
      } catch (error) {
        logger.error('FCM 초기화 실패', { error });
      }
    };
    init();
  }, []);

  // 권한 상태에 따른 UI 정보
  const getPermissionInfo = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          text: '허용됨',
          variant: 'default' as const,
        };
      case 'denied':
        return {
          icon: XCircle,
          color: 'text-red-600',
          text: '거부됨',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: Bell,
          color: 'text-yellow-600',
          text: '미설정',
          variant: 'secondary' as const,
        };
    }
  };

  // 테스트 결과 뱃지
  const getStatusBadge = (result: boolean | null) => {
    if (result === null) return <Badge variant="secondary">대기중</Badge>;
    return result ? (
      <Badge variant="default">성공</Badge>
    ) : (
      <Badge variant="destructive">실패</Badge>
    );
  };

  // FCM 서비스 상태 확인 테스트
  const testFCMHealth = async () => {
    try {
      const response = await notificationApi.checkHealth();
      setTestResults((prev) => ({ ...prev, health: response.success }));
      return response.success;
    } catch (error) {
      logger.error('FCM 헬스 체크 실패', { error });
      setTestResults((prev) => ({ ...prev, health: false }));
      return false;
    }
  };

  // 토큰 등록 테스트
  const testTokenRegistration = async () => {
    try {
      await registerToken();
      const success = isTokenRegistered && !!token;
      setTestResults((prev) => ({ ...prev, tokenRegistration: success }));
      return success;
    } catch (error) {
      logger.error('토큰 등록 테스트 실패', { error });
      setTestResults((prev) => ({ ...prev, tokenRegistration: false }));
      return false;
    }
  };

  // 설정 동기화 테스트
  const testSettingsSync = async () => {
    try {
      const originalValue = settings.diaryReminder;
      await updateSettings({
        ...settings,
        diaryReminder: !originalValue,
      });

      // 1초 후 원래 값으로 복원
      setTimeout(() => {
        updateSettings({
          ...settings,
          diaryReminder: originalValue,
        });
      }, 1000);

      setTestResults((prev) => ({ ...prev, settingsSync: true }));
      return true;
    } catch (error) {
      logger.error('설정 동기화 테스트 실패', { error });
      setTestResults((prev) => ({ ...prev, settingsSync: false }));
      return false;
    }
  };

  // 테스트 알림 전송 (API 테스트)
  const testNotificationSend = async () => {
    if (!token) {
      alert('토큰이 등록되지 않았습니다. 먼저 토큰을 등록해주세요.');
      return false;
    }

    try {
      const response = await notificationApi.sendDiaryReminder();
      setTestResults((prev) => ({
        ...prev,
        notificationSend: response.success,
      }));
      return response.success;
    } catch (error) {
      logger.error('테스트 알림 전송 실패', { error });
      setTestResults((prev) => ({ ...prev, notificationSend: false }));
      return false;
    }
  };

  // 브라우저 테스트 알림 (로컬 테스트)
  const sendLocalTestNotification = async () => {
    if (!token) {
      alert('먼저 알림 권한을 허용하고 토큰을 등록해주세요.');
      return;
    }

    try {
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
      logger.error('테스트 알림 전송 실패', { error });
      alert('테스트 알림 전송에 실패했습니다.');
    }
  };

  // 전체 테스트 실행
  const runAllTests = async () => {
    setTestResults({
      health: null,
      tokenRegistration: null,
      settingsSync: null,
      notificationSend: null,
    });

    const health = await testFCMHealth();
    if (health && permission === 'granted') {
      await testTokenRegistration();
      await testSettingsSync();
      if (isTokenRegistered) {
        await testNotificationSend();
      }
    }
  };

  const {
    icon: PermissionIcon,
    color,
    text: permissionText,
    variant,
  } = getPermissionInfo();

  if (!isInitialized) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
          <span className="ml-2">FCM 초기화 중...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 현재 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            FCM 푸시 알림 상태
          </CardTitle>
          <CardDescription>
            새김 앱의 Firebase Cloud Messaging 상태를 확인하고 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 브라우저 지원 */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">브라우저 지원</span>
              </div>
              <Badge variant={isSupported ? 'default' : 'destructive'}>
                {isSupported ? '지원됨' : '지원 안됨'}
              </Badge>
            </div>

            {/* 알림 권한 */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <PermissionIcon className={`h-4 w-4 ${color}`} />
                <span className="font-medium">알림 권한</span>
              </div>
              <Badge variant={variant}>{permissionText}</Badge>
            </div>

            {/* 토큰 등록 상태 */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">토큰 등록</span>
              </div>
              <Badge variant={isTokenRegistered ? 'default' : 'secondary'}>
                {isTokenRegistered ? '등록됨' : '미등록'}
              </Badge>
            </div>
          </div>

          {/* FCM 토큰 표시 */}
          {token && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <span className="font-medium block mb-2">FCM 토큰</span>
              <code className="text-xs bg-background p-2 rounded break-all block">
                {token}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 메인 기능 탭 */}
      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="management">관리</TabsTrigger>
          <TabsTrigger value="testing">API 테스트</TabsTrigger>
          <TabsTrigger value="history">알림 히스토리</TabsTrigger>
        </TabsList>

        {/* 관리 탭 */}
        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>FCM 관리</CardTitle>
              <CardDescription>
                푸시 알림 기능을 설정하고 관리할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 권한 요청 섹션 */}
              {permission !== 'granted' && (
                <div className="space-y-2">
                  <Button
                    onClick={requestPermission}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? '처리 중...' : '알림 권한 요청'}
                  </Button>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  onClick={registerToken}
                  disabled={
                    isLoading || !isSupported || permission !== 'granted'
                  }
                  variant={isTokenRegistered ? 'secondary' : 'default'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isTokenRegistered ? '토큰 등록됨' : '토큰 등록'}
                </Button>

                <Button
                  onClick={sendLocalTestNotification}
                  disabled={!isTokenRegistered || permission !== 'granted'}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  로컬 테스트
                </Button>

                <Button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  모두 읽음 ({unreadCount})
                </Button>

                <Button
                  onClick={clearHistory}
                  disabled={notifications.length === 0}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  히스토리 삭제
                </Button>
              </div>

              {/* 알림 설정 */}
              <div className="space-y-4">
                <h4 className="font-medium">알림 설정</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">전체 알림</span>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, enabled: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">다이어리 알림</span>
                    <Switch
                      checked={settings.diaryReminder}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, diaryReminder: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">AI 콘텐츠 알림</span>
                    <Switch
                      checked={settings.aiContentReady}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, aiContentReady: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">감정 트렌드 알림</span>
                    <Switch
                      checked={settings.emotionTrend}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, emotionTrend: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API 테스트 탭 */}
        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API 연동 테스트</CardTitle>
                  <CardDescription>
                    백엔드 FCM API와의 연동 상태를 확인하고 테스트할 수
                    있습니다.
                  </CardDescription>
                </div>
                <Button onClick={runAllTests} disabled={isLoading}>
                  <Activity className="h-4 w-4 mr-2" />
                  전체 테스트 실행
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 테스트 항목들 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">FCM 서비스 상태</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(testResults.health)}
                    <Button size="sm" variant="outline" onClick={testFCMHealth}>
                      테스트
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">토큰 등록</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(testResults.tokenRegistration)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testTokenRegistration}
                      disabled={permission !== 'granted'}
                    >
                      테스트
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">설정 동기화</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(testResults.settingsSync)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testSettingsSync}
                      disabled={!isTokenRegistered}
                    >
                      테스트
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">알림 전송 (백엔드 API)</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(testResults.notificationSend)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testNotificationSend}
                      disabled={!isTokenRegistered}
                    >
                      테스트
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 히스토리 탭 */}
        <TabsContent value="history">
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
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  아직 수신한 알림이 없습니다.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.isRead
                          ? 'bg-muted/50'
                          : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
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
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.sentAt).toLocaleString(
                                'ko-KR',
                              )}
                            </span>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 오류 메시지 */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
