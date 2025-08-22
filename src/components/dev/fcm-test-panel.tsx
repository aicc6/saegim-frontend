'use client';

import React, { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import useFCMStore, { initializeFCM } from '@/stores/fcm';
import { fcmApi } from '@/lib/fcm-api';

/**
 * FCM API 연동 테스트 패널 컴포넌트
 */
export default function FCMTestPanel() {
  const {
    token,
    isTokenRegistered,
    permission,
    isSupported,
    settings,
    isLoading,
    error,
    requestPermission,
    registerToken,
    updateSettings,
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
        console.error('FCM 초기화 실패:', error);
      }
    };
    init();
  }, []);

  // FCM 서비스 상태 확인 테스트
  const testFCMHealth = async () => {
    try {
      const response = await fcmApi.checkHealth();
      setTestResults((prev) => ({ ...prev, health: response.success }));
      return response.success;
    } catch (error) {
      console.error('FCM 헬스 체크 실패:', error);
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
      console.error('토큰 등록 테스트 실패:', error);
      setTestResults((prev) => ({ ...prev, tokenRegistration: false }));
      return false;
    }
  };

  // 설정 동기화 테스트
  const testSettingsSync = async () => {
    try {
      await updateSettings({
        ...settings,
        diaryReminder: !settings.diaryReminder, // 값을 토글하여 변경 확인
      });
      setTestResults((prev) => ({ ...prev, settingsSync: true }));

      // 원래 값으로 되돌리기
      setTimeout(() => {
        updateSettings({
          ...settings,
          diaryReminder: !settings.diaryReminder,
        });
      }, 1000);

      return true;
    } catch (error) {
      console.error('설정 동기화 테스트 실패:', error);
      setTestResults((prev) => ({ ...prev, settingsSync: false }));
      return false;
    }
  };

  // 테스트 알림 전송
  const testNotificationSend = async () => {
    if (!token) {
      alert('토큰이 등록되지 않았습니다. 먼저 토큰을 등록해주세요.');
      return false;
    }

    try {
      // 다이어리 알림 테스트 - 현재 인증된 사용자에게 전송
      const response = await fcmApi.sendDiaryReminder();
      setTestResults((prev) => ({
        ...prev,
        notificationSend: response.success,
      }));
      return response.success;
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      setTestResults((prev) => ({ ...prev, notificationSend: false }));
      return false;
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
      // 토큰이 있을 때만 알림 전송 테스트
      if (isTokenRegistered) {
        await testNotificationSend();
      }
    }
  };

  const getStatusBadge = (result: boolean | null) => {
    if (result === null) return <Badge variant="secondary">대기중</Badge>;
    return result ? (
      <Badge variant="default">성공</Badge>
    ) : (
      <Badge variant="destructive">실패</Badge>
    );
  };

  if (!isInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>FCM 초기화 중...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FCM API 연동 테스트 패널</CardTitle>
          <CardDescription>
            백엔드 FCM API와의 연동 상태를 확인하고 테스트할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 브라우저 지원 상태 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">브라우저 지원</h4>
              <p className="text-sm text-muted-foreground">
                {isSupported ? '✅ 지원됨' : '❌ 지원되지 않음'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">알림 권한</h4>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted'
                  ? '✅ 허용됨'
                  : permission === 'denied'
                    ? '❌ 거부됨'
                    : '⏳ 요청 전'}
              </p>
            </div>
          </div>

          {/* 권한 요청 */}
          {permission !== 'granted' && (
            <div className="space-y-2">
              <Button onClick={requestPermission} disabled={isLoading}>
                {isLoading ? '처리 중...' : '알림 권한 요청'}
              </Button>
            </div>
          )}

          <Separator />

          {/* 현재 상태 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">현재 상태</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">FCM 토큰</h4>
                <p className="text-sm text-muted-foreground">
                  {token
                    ? `등록됨: ${token.substring(0, 20)}...`
                    : '등록되지 않음'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">토큰 등록 상태</h4>
                <p className="text-sm text-muted-foreground">
                  {isTokenRegistered
                    ? '✅ 서버에 등록됨'
                    : '❌ 서버에 등록되지 않음'}
                </p>
              </div>
            </div>

            {/* 알림 설정 상태 */}
            <div className="space-y-3">
              <h4 className="font-medium">알림 설정</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.diaryReminder}
                    onCheckedChange={(checked) =>
                      updateSettings({ ...settings, diaryReminder: checked })
                    }
                    disabled={isLoading}
                  />
                  <span className="text-sm">다이어리 알림</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.aiContentReady}
                    onCheckedChange={(checked) =>
                      updateSettings({ ...settings, aiContentReady: checked })
                    }
                    disabled={isLoading}
                  />
                  <span className="text-sm">AI 콘텐츠 알림</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 테스트 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">API 연동 테스트</h3>
              <Button onClick={runAllTests} disabled={isLoading}>
                전체 테스트 실행
              </Button>
            </div>

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
                <span className="font-medium">알림 전송</span>
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
          </div>

          {/* 오류 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
