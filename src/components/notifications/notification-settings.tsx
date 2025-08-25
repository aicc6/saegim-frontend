'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useFCMStore } from '@/stores/fcm';

/**
 * 알림 설정 컴포넌트
 * 사용자가 프로덕션 환경에서 FCM 권한을 허용하고 설정할 수 있습니다.
 */
export default function NotificationSettings() {
  const {
    permission,
    isSupported,
    settings,
    isTokenRegistered,
    isLoading,
    error,
    requestPermission,
    updateSettings,
  } = useFCMStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // 권한 상태에 따른 아이콘 및 메시지
  const getPermissionStatus = () => {
    if (!isSupported) {
      return {
        icon: <BellOff className="h-5 w-5 text-red-500" />,
        status: '지원되지 않음',
        description: '현재 브라우저는 푸시 알림을 지원하지 않습니다.',
        variant: 'destructive' as const,
      };
    }

    switch (permission) {
      case 'granted':
        return {
          icon: <Bell className="h-5 w-5 text-green-500" />,
          status: '허용됨',
          description: '푸시 알림이 활성화되어 있습니다.',
          variant: 'default' as const,
        };
      case 'denied':
        return {
          icon: <BellOff className="h-5 w-5 text-red-500" />,
          status: '차단됨',
          description: '브라우저 설정에서 알림 권한을 허용해주세요.',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: <Smartphone className="h-5 w-5 text-orange-500" />,
          status: '권한 필요',
          description: '새김의 중요한 알림을 받으려면 권한을 허용해주세요.',
          variant: 'secondary' as const,
        };
    }
  };

  const statusInfo = getPermissionStatus();

  return (
    <div className="space-y-6">
      {/* 권한 상태 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {statusInfo.icon}
              <CardTitle>푸시 알림</CardTitle>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
          </div>
          <CardDescription>{statusInfo.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 권한 요청 버튼 */}
          {permission !== 'granted' && isSupported && (
            <div className="space-y-3">
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  다이어리 작성 리마인더, AI 분석 결과 등 유용한 알림을 받아보세요.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={requestPermission}
                disabled={isLoading || permission === 'denied'}
                className="w-full"
              >
                {isLoading ? '처리 중...' : '알림 허용하기'}
              </Button>
              
              {permission === 'denied' && (
                <p className="text-sm text-muted-foreground text-center">
                  브라우저 주소창 옆의 알림 아이콘을 클릭하거나<br />
                  설정에서 알림을 허용해주세요.
                </p>
              )}
            </div>
          )}

          {/* 알림 설정 (권한이 허용된 경우만) */}
          {permission === 'granted' && (
            <div className="space-y-4">
              {/* 토큰 등록 상태 */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">디바이스 등록</span>
                <Badge variant={isTokenRegistered ? 'default' : 'secondary'}>
                  {isTokenRegistered ? '등록됨' : '등록되지 않음'}
                </Badge>
              </div>

              {/* 기본 알림 설정 */}
              <div className="space-y-3">
                <h4 className="font-medium">알림 유형</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">다이어리 작성 리마인더</label>
                      <p className="text-xs text-muted-foreground">
                        감정 기록을 위한 부드러운 알림
                      </p>
                    </div>
                    <Switch
                      checked={settings.diaryReminder}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, diaryReminder: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">AI 콘텐츠 알림</label>
                      <p className="text-xs text-muted-foreground">
                        개인화된 글귀나 조언 생성 완료 알림
                      </p>
                    </div>
                    <Switch
                      checked={settings.aiContentReady}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, aiContentReady: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">감정 트렌드 분석</label>
                      <p className="text-xs text-muted-foreground">
                        주간/월간 감정 패턴 리포트
                      </p>
                    </div>
                    <Switch
                      checked={settings.emotionTrend}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, emotionTrend: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 고급 설정 토글 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showAdvanced ? '고급 설정 숨기기' : '고급 설정 보기'}
                </Button>

                {/* 고급 설정 */}
                {showAdvanced && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">기념일 알림</label>
                        <p className="text-xs text-muted-foreground">
                          첫 다이어리 작성일 등 특별한 순간
                        </p>
                      </div>
                      <Switch
                        checked={settings.anniversary}
                        onCheckedChange={(checked) =>
                          updateSettings({ ...settings, anniversary: checked })
                        }
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">방해 금지 시간</label>
                        <p className="text-xs text-muted-foreground">
                          설정한 시간에는 알림을 보내지 않습니다
                        </p>
                      </div>
                      <Switch
                        checked={settings.quietHours.enabled}
                        onCheckedChange={(checked) =>
                          updateSettings({
                            ...settings,
                            quietHours: { ...settings.quietHours, enabled: checked },
                          })
                        }
                        disabled={isLoading}
                      />
                    </div>

                    {settings.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-3 pl-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">시작 시간</label>
                          <input
                            type="time"
                            value={settings.quietHours.startTime}
                            onChange={(e) =>
                              updateSettings({
                                ...settings,
                                quietHours: {
                                  ...settings.quietHours,
                                  startTime: e.target.value,
                                },
                              })
                            }
                            className="w-full mt-1 p-2 text-sm border rounded"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">종료 시간</label>
                          <input
                            type="time"
                            value={settings.quietHours.endTime}
                            onChange={(e) =>
                              updateSettings({
                                ...settings,
                                quietHours: {
                                  ...settings.quietHours,
                                  endTime: e.target.value,
                                },
                              })
                            }
                            className="w-full mt-1 p-2 text-sm border rounded"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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