'use client';

import { useState } from 'react';
import {
  Bell,
  BellOff,
  Smartphone,
  Settings,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
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
import { useFCMStore } from '@/stores/fcm';
import type { NotificationSettingsUpdate } from '@/types/fcm';

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

  // 요일 옵션 정의
  const weekDays = [
    { value: 'monday', label: '월요일', short: '월' },
    { value: 'tuesday', label: '화요일', short: '화' },
    { value: 'wednesday', label: '수요일', short: '수' },
    { value: 'thursday', label: '목요일', short: '목' },
    { value: 'friday', label: '금요일', short: '금' },
    { value: 'saturday', label: '토요일', short: '토' },
    { value: 'sunday', label: '일요일', short: '일' },
  ];

  // 설정 업데이트 헬퍼 함수
  const handleSettingsUpdate = (
    updates: Partial<NotificationSettingsUpdate>,
  ) => {
    updateSettings(updates);
  };

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
      <Card className="overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-2xl bg-white dark:bg-gray-900 hover:border-sage-400 dark:hover:border-sage-500 transition-all duration-300 hover:shadow-3xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-xl shadow-sm ${
                  permission === 'granted'
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : permission === 'denied'
                      ? 'bg-red-100 dark:bg-red-900/40'
                      : 'bg-orange-100 dark:bg-orange-900/40'
                }`}
              >
                {statusInfo.icon}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
                  푸시 알림
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 mt-1 font-medium">
                  {statusInfo.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge
                variant={statusInfo.variant}
                className={`px-3 py-1 text-sm font-semibold shadow-sm ${
                  permission === 'granted'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    : permission === 'denied'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
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

        <CardContent className="space-y-6 pt-6">
          {/* 권한 요청 섹션 */}
          {permission !== 'granted' && isSupported && (
            <div className="max-w-md mx-auto text-center space-y-6">
              {/* 개선된 권한 요청 안내 */}
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl flex items-center justify-center">
                  <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                    📱 알림 설정
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    다이어리 작성 리마인더와 AI 분석 결과 등<br />
                    유용한 알림을 받아보세요!
                  </p>
                </div>
              </div>

              <Button
                onClick={requestPermission}
                disabled={isLoading || permission === 'denied'}
                size="lg"
                className={`w-full py-4 text-base font-semibold rounded-xl transition-all duration-300 ${
                  permission === 'denied'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                <Alert variant="destructive" className="text-left">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">🚫 알림이 차단되어 있습니다</p>
                      <p className="text-sm">
                        브라우저 주소창 옆의 알림 아이콘을 클릭하거나 설정에서
                        알림을 허용해주세요.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* 알림 설정 섹션 */}
          {permission === 'granted' && (
            <div className="space-y-6">
              {/* 개선된 디바이스 등록 상태 */}
              <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl hover:border-sage-400 dark:hover:border-sage-500 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isTokenRegistered
                          ? 'bg-green-100 dark:bg-green-900/50'
                          : 'bg-orange-100 dark:bg-orange-900/50'
                      }`}
                    >
                      <Smartphone
                        className={`w-5 h-5 ${
                          isTokenRegistered
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                        디바이스 등록 상태
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                        {isTokenRegistered
                          ? '이 디바이스에서 알림을 받을 수 있습니다'
                          : '디바이스 등록이 필요합니다'}
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
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <h4 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                    알림 유형
                  </h4>
                </div>

                <div className="grid gap-4">
                  {/* 푸시 알림 전체 설정 */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg mt-0.5">
                          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="push-enabled"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            🔔 푸시 알림 활성화
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            모든 푸시 알림의 전체 활성화 설정입니다
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="push-enabled"
                        checked={settings?.push_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleSettingsUpdate({ push_enabled: checked })
                        }
                        disabled={isLoading}
                        className="bg-gray-100 dark:bg-gray-700 data-[state=checked]:bg-sage-500 dark:data-[state=checked]:bg-sage-400 border-2 border-gray-400 dark:border-gray-300 data-[state=checked]:border-sage-500 dark:data-[state=checked]:border-sage-400 shadow-sm hover:shadow-md transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* 다이어리 작성 리마인더 */}
                  <div className="p-5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/70 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mt-0.5">
                          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="diary-reminder"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            📝 다이어리 작성 리마인더
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            감정 기록을 위한 부드러운 알림을 보내드려요
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="diary-reminder"
                        checked={settings?.diary_reminder_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleSettingsUpdate({
                            diary_reminder_enabled: checked,
                          })
                        }
                        disabled={isLoading}
                        className="bg-gray-100 dark:bg-gray-700 data-[state=checked]:bg-sage-500 dark:data-[state=checked]:bg-sage-400 border-2 border-gray-400 dark:border-gray-300 data-[state=checked]:border-sage-500 dark:data-[state=checked]:border-sage-400 shadow-sm hover:shadow-md transition-all duration-200"
                      />
                    </div>

                    {/* 리마인더 시간 설정 */}
                    {settings?.diary_reminder_enabled && (
                      <div className="pt-3 border-t border-blue-100 dark:border-blue-800 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            <label
                              htmlFor="diary-reminder-time"
                              className="text-sm font-medium text-text-primary dark:text-text-primary-dark"
                            >
                              리마인더 시간
                            </label>
                          </div>
                          <input
                            id="diary-reminder-time"
                            type="time"
                            value={settings?.diary_reminder_time || '21:00'}
                            onChange={(e) =>
                              handleSettingsUpdate({
                                diary_reminder_time: e.target.value,
                              })
                            }
                            className="w-full p-3 text-sm border-2 border-gray-400 dark:border-gray-300 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-sage-500/30 dark:focus:ring-sage-400/40 focus:border-sage-500 dark:focus:border-sage-400 hover:border-sage-400 dark:hover:border-sage-500 shadow-sm hover:shadow-md transition-all duration-200"
                            disabled={isLoading}
                          />
                        </div>

                        {/* 리마인더 요일 설정 */}
                        <fieldset className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            <legend className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                              리마인더 요일
                            </legend>
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {weekDays.map((day) => {
                              const isSelected =
                                settings?.diary_reminder_days?.includes(
                                  day.value,
                                ) ?? false;
                              return (
                                <button
                                  key={day.value}
                                  type="button"
                                  onClick={() => {
                                    const currentDays =
                                      settings?.diary_reminder_days || [];
                                    const newDays = isSelected
                                      ? currentDays.filter(
                                          (d) => d !== day.value,
                                        )
                                      : [...currentDays, day.value];
                                    handleSettingsUpdate({
                                      diary_reminder_days: newDays,
                                    });
                                  }}
                                  disabled={isLoading}
                                  className={`p-2.5 text-xs font-semibold rounded-lg transition-all duration-200 border-2 ${
                                    isSelected
                                      ? 'bg-sage-500 dark:bg-sage-400 text-white shadow-lg border-sage-500 dark:border-sage-400 hover:bg-sage-600 dark:hover:bg-sage-500 hover:shadow-xl transform hover:scale-105'
                                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-400 dark:border-gray-300 hover:bg-sage-50 dark:hover:bg-sage-500/10 hover:text-sage-700 dark:hover:text-sage-300 hover:border-sage-400 dark:hover:border-sage-400 shadow-sm hover:shadow-md transform hover:scale-105'
                                  }`}
                                >
                                  {day.short}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                            {settings?.diary_reminder_days?.length || 0}개 요일
                            선택됨
                          </p>
                        </fieldset>
                      </div>
                    )}
                  </div>

                  {/* AI 처리 알림 */}
                  <div className="p-5 bg-purple-50 dark:bg-purple-950/30 rounded-xl border-2 border-purple-200 dark:border-purple-800/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700/70 hover:bg-purple-100 dark:hover:bg-purple-900/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg mt-0.5">
                          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="ai-processing"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            ✨ AI 처리 알림
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            AI 분석 및 콘텐츠 생성 완료시 알려드려요
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="ai-processing"
                        checked={settings?.ai_processing_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleSettingsUpdate({
                            ai_processing_enabled: checked,
                          })
                        }
                        disabled={isLoading}
                        className="bg-gray-100 dark:bg-gray-700 data-[state=checked]:bg-sage-500 dark:data-[state=checked]:bg-sage-400 border-2 border-gray-400 dark:border-gray-300 data-[state=checked]:border-sage-500 dark:data-[state=checked]:border-sage-400 shadow-sm hover:shadow-md transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* 리포트 알림 */}
                  <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 rounded-xl border border-green-100 dark:border-green-900/30 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg mt-0.5">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="report-notification"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            📊 리포트 알림
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            주간/월간 감정 분석 리포트를 받아보세요
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="report-notification"
                        checked={settings?.report_notification_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleSettingsUpdate({
                            report_notification_enabled: checked,
                          })
                        }
                        disabled={isLoading}
                        className="bg-gray-100 dark:bg-gray-700 data-[state=checked]:bg-sage-500 dark:data-[state=checked]:bg-sage-400 border-2 border-gray-400 dark:border-gray-300 data-[state=checked]:border-sage-500 dark:data-[state=checked]:border-sage-400 shadow-sm hover:shadow-md transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* 고급 설정 토글 */}
                <div className="pt-4 border-t border-border-subtle dark:border-border-dark">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-md hover:bg-sage-50 dark:hover:bg-gray-700 hover:border-sage-400 dark:hover:border-sage-500 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      <span className="font-medium text-text-primary dark:text-text-primary-dark">
                        {showAdvanced ? '고급 설정 숨기기' : '고급 설정 보기'}
                      </span>
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </div>
                  </Button>

                  {/* 고급 설정 */}
                  {showAdvanced && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* 브라우저 푸시 알림 */}
                      <div className="p-5 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border-2 border-cyan-200 dark:border-cyan-800/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-700/70 hover:bg-cyan-100 dark:hover:bg-cyan-900/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg mt-0.5">
                              <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="space-y-1">
                              <label
                                htmlFor="browser-push"
                                className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                              >
                                🌐 브라우저 푸시 알림
                              </label>
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                브라우저를 통한 직접적인 푸시 알림 활성화
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="browser-push"
                            checked={settings?.browser_push_enabled ?? false}
                            onCheckedChange={(checked) =>
                              handleSettingsUpdate({
                                browser_push_enabled: checked,
                              })
                            }
                            disabled={isLoading}
                            className="bg-gray-100 dark:bg-gray-700 data-[state=checked]:bg-sage-500 dark:data-[state=checked]:bg-sage-400 border-2 border-gray-400 dark:border-gray-300 data-[state=checked]:border-sage-500 dark:data-[state=checked]:border-sage-400 shadow-sm hover:shadow-md transition-all duration-200"
                          />
                        </div>
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
