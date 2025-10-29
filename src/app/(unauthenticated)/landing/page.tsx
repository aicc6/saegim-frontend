'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  Sparkles,
  Calendar,
  Shield,
  Play,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ToastAction, type ToastActionElement } from '@/components/ui/toast';

const features = [
  {
    icon: Sparkles,
    titleKey: 'landing.features.items.ai.title',
    descriptionKey: 'landing.features.items.ai.description',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Heart,
    titleKey: 'landing.features.items.analysis.title',
    descriptionKey: 'landing.features.items.analysis.description',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Calendar,
    titleKey: 'landing.features.items.calendar.title',
    descriptionKey: 'landing.features.items.calendar.description',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Shield,
    titleKey: 'landing.features.items.privacy.title',
    descriptionKey: 'landing.features.items.privacy.description',
    color: 'bg-green-100 text-green-600',
  },
];

// useSearchParams를 사용하는 컴포넌트를 분리
function LandingWithSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // URL 파라미터에서 상태 확인
    const status = searchParams.get('status');

    if (status) {
      const messages: Record<
        string,
        {
          type: 'success' | 'info' | 'warning';
          title: string;
          description: string;
          icon: React.ComponentType<{ className?: string }>;
        }
      > = {
        logout: {
          type: 'success',
          title: t('landing.status.logout.title'),
          description: t('landing.status.logout.description'),
          icon: CheckCircle,
        },
        withdraw: {
          type: 'success',
          title: t('landing.status.withdraw.title'),
          description:
            searchParams.get('message') ||
            t('landing.status.withdraw.description'),
          icon: CheckCircle,
        },

        token_expired: {
          type: 'warning',
          title: t('landing.status.tokenExpired.title'),
          description: t('landing.status.tokenExpired.description'),
          icon: AlertCircle,
        },
      };

      const selectedMessage = messages[status];
      if (selectedMessage) {
        // 기존 타이머가 있으면 정리
        if (statusTimerRef.current) {
          clearTimeout(statusTimerRef.current);
        }

        // 토스트 알림 표시 (탈퇴: 5초, 세션 만료: 무제한)
        const duration = status === 'withdraw' ? 5000 : undefined;

        // 세션 만료 토스트의 경우 클릭 가능한 액션 추가
        const toastConfig: {
          title: string;
          description: string;
          variant: 'default' | 'destructive';
          duration?: number;
          className: string;
          action?: ToastActionElement;
        } = {
          title: selectedMessage.title,
          description: selectedMessage.description,
          variant:
            selectedMessage.type === 'success'
              ? 'default'
              : selectedMessage.type === 'warning'
                ? 'destructive'
                : 'default',
          duration: duration,
          className:
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white',
        };

        // 세션 만료 토스트의 경우 로그인 버튼 액션 추가
        if (status === 'token_expired') {
          toastConfig.action = (
            <ToastAction
              altText={t('landing.toastAction.loginAlt')}
              onClick={() => {
                // 타이머가 있으면 정리
                if (statusTimerRef.current) {
                  clearTimeout(statusTimerRef.current);
                  statusTimerRef.current = null;
                }
                // URL 파라미터 정리하고 로그인 페이지로 이동
                router.replace('/landing');
                router.push('/login');
              }}
            >
              {t('auth.loginButton')}
            </ToastAction>
          );
        }

        // 탈퇴의 경우 토스트 표시하지 않음 (프로필 페이지에서 이미 표시됨)
        if (status === 'withdraw') {
          // 즉시 URL 파라미터 정리
          router.replace('/landing');
        } else {
          // 다른 상태는 토스트 알림 표시
          toast(toastConfig);

          if (status === 'token_expired') {
            // 세션 만료의 경우 토스트 시간에 맞춰서 URL 파라미터 정리
            const timer = setTimeout(() => {
              statusTimerRef.current = null;
              router.replace('/landing');
            }, duration);

            statusTimerRef.current = timer;
          }
        }
      }
    }

    // cleanup 함수: 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, [searchParams, router, toast, t]);

  const handleStartNow = () => {
    // 타이머가 있으면 정리하고 URL 파라미터도 정리
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    // URL 파라미터 정리
    router.replace('/landing');
    router.push('/login');
  };

  const handleViewRecords = () => {
    // 타이머가 있으면 정리하고 URL 파라미터도 정리
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    // URL 파라미터 정리
    router.replace('/landing');
    router.push('/login?redirect=records');
  };

  const quoteLines = t('landing.hero.quoteText').split('\n');

  return (
    <>
      <section className="relative overflow-hidden py-20 lg:py-32 bg-sage-20 transition-colors">
        {/* 히어로 섹션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 텍스트 콘텐츠 */}
            <div className="space-y-4">
              <Badge className="bg-sage-20 text-sage-100 hover:bg-sage-30">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('landing.hero.badge')}
              </Badge>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-sage-100 leading-tight">
                <span className="block sm:whitespace-nowrap">
                  {t('landing.hero.titleLine1')}
                </span>
                <span className="block sm:whitespace-nowrap text-sage-70">
                  {t('landing.hero.titleLine2')}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-sage-80 leading-relaxed max-w-2xl">
                {t('landing.hero.descriptionMain')}
                <span className="block mt-2">
                  {t('landing.hero.descriptionSub')}
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="bg-sage-50 hover:bg-sage-60 text-white w-full sm:w-auto"
                  onClick={handleStartNow}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {t('landing.hero.startNow')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-sage-30 bg-sage-10 text-sage-100 hover:bg-sage-20 w-full sm:w-auto shadow-sm"
                  onClick={handleViewRecords}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t('landing.hero.viewRecords')}
                </Button>
              </div>
            </div>

            {/* 이미지/일러스트 */}
            <div className="relative">
              <div className="relative z-10">
                <Card className="p-6 bg-sage-10/80 backdrop-blur-sm border-sage-30 shadow-xl">
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-sage-20 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-sage-70" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sage-100">
                          {t('landing.hero.quoteTitle')}
                        </h3>
                        <p className="text-sm text-sage-70">
                          {t('landing.hero.quoteSubtitle')}
                        </p>
                      </div>
                    </div>
                    <div className="bg-sage-30 p-4 rounded-lg">
                      <p className="text-sage-80 font-serif leading-relaxed text-center">
                        &quot;
                        {quoteLines.map((line, index) => (
                          <span key={`${line}-${index}`}>
                            {line}
                            {index < quoteLines.length - 1 && <br />}
                          </span>
                        ))}
                        &quot;
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-sage-60">
                      <span>{t('landing.hero.generatedLabel')}</span>
                      <span>{t('landing.hero.sampleDate')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* 배경 장식 */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-sage-30 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-sage-40 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section id="features" className="py-20 bg-sage-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-sage-100">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-sage-70 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-sage-20 hover:shadow-lg transition-shadow bg-sage-10"
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div
                      className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mx-auto`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-sage-100">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-sage-70 text-sm leading-relaxed">
                      {t(feature.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Toaster />
    </>
  );
}

// 기본 export는 Suspense로 감싼 컴포넌트
export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <LandingWithSearchParams />
    </Suspense>
  );
}
