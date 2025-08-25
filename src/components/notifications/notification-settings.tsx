'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Settings, Sparkles, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="space-y-8">
      {/* 개선된 권한 상태 카드 */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white via-sage-5 to-white dark:from-gray-800 dark:via-gray-750 dark:to-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl shadow-sm ${
                permission === 'granted' 
                  ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/30' 
                  : permission === 'denied'
                  ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30'
                  : 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/30'
              }`}>
                {statusInfo.icon}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-sage-90 dark:text-gray-100">
                  푸시 알림
                </CardTitle>
                <CardDescription className="text-sage-60 dark:text-gray-400 mt-1">
                  {statusInfo.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge 
                variant={statusInfo.variant}
                className={`px-3 py-1 text-sm font-semibold shadow-sm ${
                  permission === 'granted'
                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/50 dark:to-green-800/40 dark:text-green-300'
                    : permission === 'denied'
                    ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/50 dark:to-red-800/40 dark:text-red-300'
                    : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/50 dark:to-orange-800/40 dark:text-orange-300'
                }`}
              >
                {statusInfo.status}
              </Badge>
              {permission === 'granted' && isTokenRegistered && (
                <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">활성화됨</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          {/* 권한 요청 섹션 */}
          {permission !== 'granted' && isSupported && (
            <div className="space-y-4">
              <Alert className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <AlertDescription className="text-sage-80 dark:text-gray-200 font-medium">
                    다이어리 작성 리마인더, AI 분석 결과 등 유용한 알림을 받아보세요! 📱✨
                  </AlertDescription>
                </div>
              </Alert>
              
              <Button
                onClick={requestPermission}
                disabled={isLoading || permission === 'denied'}
                className={`w-full py-3 text-base font-semibold rounded-xl transition-all duration-300 ${
                  permission === 'denied' 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>처리 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>알림 허용하기</span>
                  </div>
                )}
              </Button>
              
              {permission === 'denied' && (
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-xl">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                    🚫 알림이 차단되어 있습니다
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                    브라우저 주소창 옆의 알림 아이콘을 클릭하거나<br />
                    설정에서 알림을 허용해주세요.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 알림 설정 섹션 */}
          {permission === 'granted' && (
            <div className="space-y-6">
              {/* 개선된 디바이스 등록 상태 */}
              <div className="p-4 bg-gradient-to-r from-sage-10 to-sage-15 dark:from-gray-700 dark:to-gray-650 rounded-xl border border-sage-20 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isTokenRegistered 
                        ? 'bg-green-100 dark:bg-green-900/50' 
                        : 'bg-orange-100 dark:bg-orange-900/50'
                    }`}>
                      <Smartphone className={`w-5 h-5 ${
                        isTokenRegistered 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-sage-90 dark:text-gray-200">
                        디바이스 등록 상태
                      </span>
                      <p className="text-xs text-sage-60 dark:text-gray-400">
                        {isTokenRegistered 
                          ? '이 디바이스에서 알림을 받을 수 있습니다' 
                          : '디바이스 등록이 필요합니다'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={isTokenRegistered ? 'default' : 'secondary'}
                    className={`px-3 py-1 font-semibold ${
                      isTokenRegistered
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                    }`}
                  >
                    {isTokenRegistered ? '✓ 등록됨' : '⏸ 등록되지 않음'}
                  </Badge>
                </div>
              </div>

              {/* 개선된 알림 유형 설정 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Settings className="w-5 h-5 text-sage-60 dark:text-gray-400" />
                  <h4 className="text-lg font-semibold text-sage-90 dark:text-gray-200">알림 유형</h4>
                </div>
                
                <div className="grid gap-4">
                  {/* 다이어리 작성 리마인더 */}
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-xl border border-blue-100 dark:border-blue-900/30 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mt-0.5">
                          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-sage-90 dark:text-gray-200 cursor-pointer">
                            📝 다이어리 작성 리마인더
                          </label>
                          <p className="text-xs text-sage-60 dark:text-gray-400 leading-relaxed">
                            감정 기록을 위한 부드러운 알림을 보내드려요
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.diaryReminder}
                        onCheckedChange={(checked) =>
                          updateSettings({ ...settings, diaryReminder: checked })
                        }
                        disabled={isLoading}
                        className="bg-sage-20 dark:bg-gray-600 data-[state=checked]:bg-sage-60 dark:data-[state=checked]:bg-sage-70 border border-sage-30 dark:border-gray-500"
                      />
                    </div>
                  </div>

                  {/* AI 콘텐츠 알림 */}
                  <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 rounded-xl border border-purple-100 dark:border-purple-900/30 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg mt-0.5">
                          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-sage-90 dark:text-gray-200 cursor-pointer">
                            ✨ AI 콘텐츠 알림
                          </label>
                          <p className="text-xs text-sage-60 dark:text-gray-400 leading-relaxed">
                            개인화된 글귀나 조언이 준비되면 알려드려요
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.aiContentReady}
                        onCheckedChange={(checked) =>
                          updateSettings({ ...settings, aiContentReady: checked })
                        }
                        disabled={isLoading}
                        className="bg-sage-20 dark:bg-gray-600 data-[state=checked]:bg-sage-60 dark:data-[state=checked]:bg-sage-70 border border-sage-30 dark:border-gray-500"
                      />
                    </div>
                  </div>

                  {/* 감정 트렌드 분석 */}
                  <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 rounded-xl border border-green-100 dark:border-green-900/30 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg mt-0.5">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-sage-90 dark:text-gray-200 cursor-pointer">
                            📊 감정 트렌드 분석
                          </label>
                          <p className="text-xs text-sage-60 dark:text-gray-400 leading-relaxed">
                            주간/월간 감정 패턴 리포트를 받아보세요
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.emotionTrend}
                        onCheckedChange={(checked) =>
                          updateSettings({ ...settings, emotionTrend: checked })
                        }
                        disabled={isLoading}
                        className="bg-sage-20 dark:bg-gray-600 data-[state=checked]:bg-sage-60 dark:data-[state=checked]:bg-sage-70 border border-sage-30 dark:border-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 개선된 고급 설정 토글 */}
                <div className="pt-4 border-t border-sage-20 dark:border-gray-600">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full p-4 rounded-xl bg-sage-5 dark:bg-gray-750 hover:bg-sage-10 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Settings className="h-4 w-4 text-sage-60 dark:text-gray-400" />
                      <span className="font-medium text-sage-80 dark:text-gray-300">
                        {showAdvanced ? '고급 설정 숨기기' : '고급 설정 보기'}
                      </span>
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4 text-sage-60 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-sage-60 dark:text-gray-400" />
                      )}
                    </div>
                  </Button>

                  {/* 개선된 고급 설정 */}
                  {showAdvanced && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* 기념일 알림 */}
                      <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 rounded-xl border border-amber-100 dark:border-amber-900/30 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg mt-0.5">
                              <span className="text-sm">🎉</span>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-semibold text-sage-90 dark:text-gray-200 cursor-pointer">
                                🎂 기념일 알림
                              </label>
                              <p className="text-xs text-sage-60 dark:text-gray-400 leading-relaxed">
                                첫 다이어리 작성일 등 특별한 순간을 기억해드려요
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.anniversary}
                            onCheckedChange={(checked) =>
                              updateSettings({ ...settings, anniversary: checked })
                            }
                            disabled={isLoading}
                            className="bg-sage-20 dark:bg-gray-600 data-[state=checked]:bg-sage-60 dark:data-[state=checked]:bg-sage-70 border border-sage-30 dark:border-gray-500"
                          />
                        </div>
                      </div>

                      {/* 방해 금지 시간 */}
                      <div className="p-4 bg-gradient-to-r from-slate-50/50 to-gray-50/30 dark:from-slate-950/20 dark:to-gray-950/10 rounded-xl border border-slate-100 dark:border-slate-900/30 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg mt-0.5">
                              <span className="text-sm">🌙</span>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-semibold text-sage-90 dark:text-gray-200 cursor-pointer">
                                🔕 방해 금지 시간
                              </label>
                              <p className="text-xs text-sage-60 dark:text-gray-400 leading-relaxed">
                                설정한 시간에는 알림을 보내지 않습니다
                              </p>
                            </div>
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
                            className="bg-sage-20 dark:bg-gray-600 data-[state=checked]:bg-sage-60 dark:data-[state=checked]:bg-sage-70 border border-sage-30 dark:border-gray-500"
                          />
                        </div>

                        {settings.quietHours.enabled && (
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-sage-70 dark:text-gray-300">
                                시작 시간
                              </label>
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
                                className="w-full p-3 text-sm border border-sage-20 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200"
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-sage-70 dark:text-gray-300">
                                종료 시간
                              </label>
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
                                className="w-full p-3 text-sm border border-sage-20 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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