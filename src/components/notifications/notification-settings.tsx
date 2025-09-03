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
      <Card className="overflow-hidden rounded-2xl border border-border-subtle dark:border-border-dark shadow-2xl bg-background-primary dark:bg-background-dark-secondary transition-colors hover:shadow-3xl">
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
                <CardDescription className="text-text-secondary dark:text-text-secondary-dark mt-1 font-medium">
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
                <div className="mx-auto w-16 h-16 rounded-2xl bg-background-secondary dark:bg-background-dark-secondary flex items-center justify-center">
                  <Bell className="w-8 h-8 text-sage-70 dark:text-sage-40" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                    📱 알림 설정
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed font-medium">
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
              <div className="p-5 bg-background-secondary dark:bg-background-dark rounded-xl border-2 border-border-subtle dark:border-border-dark shadow-lg hover:shadow-xl hover:border-sage-400 dark:hover:border-sage-500 transition-all duration-300">
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
                      <p className="text-xs text-text-secondary dark:text-text-secondary-dark font-medium">
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
                  <Settings className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                  <h4 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                    알림 유형
                  </h4>
                </div>

                <div className="grid gap-4">
                  {/* 푸시 알림 전체 설정 */}
                  <div className="p-4 rounded-xl bg-background-secondary dark:bg-background-dark border border-border-subtle dark:border-border-dark transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg mt-0.5 bg-background-hover dark:bg-background-dark-secondary">
                          <Bell className="w-4 h-4 text-sage-70 dark:text-sage-40" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="push-enabled"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            🔔 푸시 알림 활성화
                          </label>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed font-medium">
                            모든 푸시 알림의 전체 활성화 설정입니다
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="push-enabled"
                          checked={settings?.push_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleSettingsUpdate({ push_enabled: checked })
                          }
                          disabled={isLoading}
                        />
                        <span
                          className={`text-sm font-semibold transition-colors duration-200 ${
                            (settings?.push_enabled ?? true)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {(settings?.push_enabled ?? true) ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 다이어리 작성 리마인더 */}
                  <div className="p-5 rounded-xl bg-background-secondary dark:bg-background-dark border-2 border-border-subtle dark:border-border-dark shadow-lg transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg mt-0.5 bg-background-hover dark:bg-background-dark-secondary">
                          <Bell className="w-4 h-4 text-sage-70 dark:text-sage-40" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="diary-reminder"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            📝 다이어리 작성 리마인더
                          </label>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed font-medium">
                            감정 기록을 위한 부드러운 알림을 보내드려요
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="diary-reminder"
                          checked={settings?.diary_reminder_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleSettingsUpdate({
                              diary_reminder_enabled: checked,
                            })
                          }
                          disabled={isLoading}
                        />
                        <span
                          className={`text-sm font-semibold transition-colors duration-200 ${
                            (settings?.diary_reminder_enabled ?? true)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {(settings?.diary_reminder_enabled ?? true)
                            ? 'ON'
                            : 'OFF'}
                        </span>
                      </div>
                    </div>

                    {/* 리마인더 시간 설정 */}
                    {settings?.diary_reminder_enabled && (
                      <div className="pt-3 border-t border-border-subtle dark:border-border-dark space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-sage-60 dark:text-sage-40" />
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
                            className="w-full p-3 text-sm border-2 border-border-subtle dark:border-border-dark rounded-lg bg-background-primary dark:bg-background-dark-secondary text-text-primary dark:text-text-primary-dark focus:ring-4 focus:ring-sage-500/30 dark:focus:ring-sage-400/40 focus:border-sage-500 dark:focus:border-sage-400 hover:border-sage-400 dark:hover:border-sage-500 shadow-sm hover:shadow-md transition-all duration-200"
                            disabled={isLoading}
                          />
                        </div>

                        {/* 리마인더 요일 설정 */}
                        <fieldset className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-sage-60 dark:text-sage-40" />
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
                                      : 'bg-background-primary dark:bg-background-dark-secondary text-text-primary dark:text-text-primary-dark border-border-subtle dark:border-border-dark hover:bg-sage-50 dark:hover:bg-sage-500/10 hover:text-sage-700 dark:hover:text-sage-300 hover:border-sage-400 dark:hover:border-sage-400 shadow-sm hover:shadow-md transform hover:scale-105'
                                  }`}
                                >
                                  {day.short}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark font-medium">
                            {settings?.diary_reminder_days?.length || 0}개 요일
                            선택됨
                          </p>
                        </fieldset>
                      </div>
                    )}
                  </div>

                  {/* AI 처리 알림 */}
                  <div className="p-5 rounded-xl bg-background-secondary dark:bg-background-dark border-2 border-border-subtle dark:border-border-dark shadow-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg mt-0.5 bg-background-hover dark:bg-background-dark-secondary">
                          <Sparkles className="w-4 h-4 text-sage-70 dark:text-sage-40" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="ai-processing"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            ✨ AI 처리 알림
                          </label>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed font-medium">
                            AI 분석 및 콘텐츠 생성 완료시 알려드려요
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="ai-processing"
                          checked={settings?.ai_processing_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleSettingsUpdate({
                              ai_processing_enabled: checked,
                            })
                          }
                          disabled={isLoading}
                        />
                        <span
                          className={`text-sm font-semibold transition-colors duration-200 ${
                            (settings?.ai_processing_enabled ?? true)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {(settings?.ai_processing_enabled ?? true)
                            ? 'ON'
                            : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 리포트 알림 */}
                  <div className="p-4 rounded-xl bg-background-secondary dark:bg-background-dark border border-border-subtle dark:border-border-dark transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg mt-0.5 bg-background-hover dark:bg-background-dark-secondary">
                          <TrendingUp className="w-4 h-4 text-sage-70 dark:text-sage-40" />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="report-notification"
                            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                          >
                            📊 리포트 알림
                          </label>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed font-medium">
                            주간/월간 감정 분석 리포트를 받아보세요
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="report-notification"
                          checked={
                            settings?.report_notification_enabled ?? true
                          }
                          onCheckedChange={(checked) =>
                            handleSettingsUpdate({
                              report_notification_enabled: checked,
                            })
                          }
                          disabled={isLoading}
                        />
                        <span
                          className={`text-sm font-semibold transition-colors duration-200 ${
                            (settings?.report_notification_enabled ?? true)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {(settings?.report_notification_enabled ?? true)
                            ? 'ON'
                            : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 고급 설정 토글 */}
                <div className="pt-4 border-t border-border-subtle dark:border-border-dark">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full p-4 rounded-xl bg-background-secondary dark:bg-background-dark border-2 border-border-subtle dark:border-border-dark shadow-md hover:bg-background-hover dark:hover:bg-background-dark-secondary hover:border-sage-400 dark:hover:border-sage-500 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Settings className="h-4 w-4 text-text-secondary dark:text-text-secondary-dark" />
                      <span className="font-medium text-text-primary dark:text-text-primary-dark">
                        {showAdvanced ? '고급 설정 숨기기' : '고급 설정 보기'}
                      </span>
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4 text-text-secondary dark:text-text-secondary-dark" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-secondary dark:text-text-secondary-dark" />
                      )}
                    </div>
                  </Button>

                  {/* 고급 설정 */}
                  {showAdvanced && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* 브라우저 푸시 알림 */}
                      <div className="p-5 rounded-xl bg-background-secondary dark:bg-background-dark border-2 border-border-subtle dark:border-border-dark shadow-lg transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-lg mt-0.5 bg-background-hover dark:bg-background-dark-secondary">
                              <Smartphone className="w-4 h-4 text-sage-70 dark:text-sage-40" />
                            </div>
                            <div className="space-y-1">
                              <label
                                htmlFor="browser-push"
                                className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer"
                              >
                                🌐 브라우저 푸시 알림
                              </label>
                              <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed font-medium">
                                브라우저를 통한 직접적인 푸시 알림 활성화
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Switch
                              id="browser-push"
                              checked={settings?.browser_push_enabled ?? false}
                              onCheckedChange={(checked) =>
                                handleSettingsUpdate({
                                  browser_push_enabled: checked,
                                })
                              }
                              disabled={isLoading}
                            />
                            <span
                              className={`text-sm font-semibold transition-colors duration-200 ${
                                (settings?.browser_push_enabled ?? false)
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {(settings?.browser_push_enabled ?? false)
                                ? 'ON'
                                : 'OFF'}
                            </span>
                          </div>
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
