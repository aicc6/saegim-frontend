'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import {
  Heart,
  Sparkles,
  Calendar,
  Shield,
  Play,
  CheckCircle,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ToastAction, type ToastActionElement } from '@/components/ui/toast';
import { getAppDownloadUrl } from '@/lib/api';

const features = [
  {
    icon: Sparkles,
    title: 'AI 감성 글귀 생성',
    description:
      '키워드만 입력하면 AI가 당신의 감정을 담은 아름다운 시와 산문을 만들어드려요',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Heart,
    title: '감정 분석 & 리포트',
    description:
      'AI가 당신의 감정을 분석하고 월간 감정 패턴을 시각적으로 보여드려요',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Calendar,
    title: '감정 캘린더',
    description:
      '매일의 감정을 캘린더에서 한눈에 확인하고 감정의 변화를 추적해보세요',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Shield,
    title: '완전한 프라이버시',
    description:
      '모든 기록은 암호화되어 안전하게 보관되며, 오직 당신만 볼 수 있어요',
    color: 'bg-green-100 text-green-600',
  },
];

// useSearchParams를 사용하는 컴포넌트를 분리
function LandingWithSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [androidDownloadUrl, setAndroidDownloadUrl] = useState<string | null>(
    null,
  );
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);

  // 앱 다운로드 URL 로드
  useEffect(() => {
    const loadDownloadUrl = async () => {
      setIsLoadingDownload(true);
      try {
        const url = await getAppDownloadUrl('android');
        setAndroidDownloadUrl(url);
      } catch (error) {
        console.error('Failed to load Android download URL:', error);
      } finally {
        setIsLoadingDownload(false);
      }
    };

    loadDownloadUrl();
  }, []);

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
          title: '로그아웃되었습니다',
          description:
            '안전하게 로그아웃되었습니다. 언제든지 다시 로그인하실 수 있습니다.',
          icon: CheckCircle,
        },
        withdraw: {
          type: 'success',
          title: '✅ 계정 탈퇴가 완료되었습니다',
          description:
            searchParams.get('message') ||
            '계정이 성공적으로 탈퇴되었습니다. 30일 이내에 복구할 수 있으며, 그 이후에는 모든 데이터가 영구적으로 삭제됩니다.',
          icon: CheckCircle,
        },

        token_expired: {
          type: 'warning',
          title: '세션이 만료되었습니다',
          description: '보안을 위해 다시 로그인해주세요.',
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
              altText="로그인 페이지로 이동"
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
              로그인하기
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
  }, [searchParams, router, toast]);

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

  const handleDownloadApp = () => {
    if (androidDownloadUrl) {
      window.open(androidDownloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: '다운로드 불가',
        description:
          '앱 다운로드 링크를 불러오는 중입니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

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
                AI 기반 감성 다이어리
              </Badge>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-sage-100 leading-tight">
                <span className="block sm:whitespace-nowrap">
                  마음을 새기는
                </span>
                <span className="block sm:whitespace-nowrap text-sage-70">
                  특별한 여정
                </span>
              </h1>
              <p className="text-base sm:text-lg text-sage-80 leading-relaxed max-w-2xl">
                마음에 새기는 감성 AI 다이어리. 자연에서 얻는 치유와 성장의 기록
                공간에서 AI가 당신의 감정을 이해하고 아름다운 글귀로
                표현해드려요.
                <span className="block mt-2">
                  당신의 소중한 감정을 기록하고, 마음의 평화를 찾아보세요.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="bg-sage-50 hover:bg-sage-60 text-white w-full sm:w-auto"
                  onClick={handleStartNow}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  지금 바로 시작하기
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-sage-30 bg-sage-10 text-sage-100 hover:bg-sage-20 w-full sm:w-auto shadow-sm"
                  onClick={handleViewRecords}
                >
                  <Play className="w-4 h-4 mr-2" />
                  기록 보기
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-sage-30 bg-sage-10 text-sage-100 hover:bg-sage-20 w-full sm:w-auto shadow-sm"
                  onClick={handleDownloadApp}
                  disabled={isLoadingDownload || !androidDownloadUrl}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {isLoadingDownload ? '로딩 중...' : '안드로이드 앱 다운로드'}
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
                          오늘의 감정
                        </h3>
                        <p className="text-sm text-sage-70">평온한 하루</p>
                      </div>
                    </div>
                    <div className="bg-sage-30 p-4 rounded-lg">
                      <p className="text-sage-80 font-serif leading-relaxed text-center">
                        &quot;바람에 흔들리는 나뭇잎처럼
                        <br />
                        마음도 자연스럽게 흘러가네
                        <br />
                        오늘이라는 선물을 받아
                        <br />
                        감사의 마음으로 새김하며&quot;
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-sage-60">
                      <span>AI 생성 글귀</span>
                      <span>2025.01.16</span>
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

      {/* 모바일 앱 다운로드 섹션 */}
      <section className="py-16 bg-gradient-to-b from-sage-20 to-sage-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-sage-10/80 backdrop-blur-sm border border-sage-30 rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* 텍스트 콘텐츠 */}
              <div className="p-8 lg:p-12 space-y-6">
                <div className="inline-flex items-center gap-2 bg-sage-20 text-sage-100 px-4 py-2 rounded-full text-sm font-medium">
                  <Smartphone className="w-4 h-4" />
                  모바일 앱 출시
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-sage-100">
                  언제 어디서나
                  <br />
                  <span className="text-sage-70">새김과 함께</span>
                </h2>
                <p className="text-lg text-sage-80 leading-relaxed">
                  새김 안드로이드 앱을 다운로드하고 언제 어디서나 당신의 감정을
                  기록하세요. 모바일에 최적화된 UI로 더욱 편리하게 일기를 작성할
                  수 있습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-sage-50 hover:bg-sage-60 text-white"
                    onClick={handleDownloadApp}
                    disabled={isLoadingDownload || !androidDownloadUrl}
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    {isLoadingDownload
                      ? '로딩 중...'
                      : '안드로이드 앱 다운로드'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-sage-30 text-sage-100 hover:bg-sage-10"
                    disabled
                  >
                    iOS 앱 준비 중
                  </Button>
                </div>
                <p className="text-sm text-sage-60">
                  ✨ 현재 안드로이드 버전이 제공됩니다. iOS 버전도 곧 출시될
                  예정입니다.
                </p>
              </div>

              {/* 이미지/일러스트 */}
              <div className="relative bg-gradient-to-br from-sage-20 to-sage-30 p-8 lg:p-12 h-full min-h-[400px] flex items-center justify-center">
                <div className="relative">
                  {/* 모바일 앱 미리보기 카드 */}
                  <div className="bg-sage-10/80 backdrop-blur-sm border border-sage-30 rounded-3xl shadow-2xl p-6 max-w-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-sage-20 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-sage-70" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sage-100">새김</h3>
                          <p className="text-sm text-sage-70">
                            감성 AI 다이어리
                          </p>
                        </div>
                      </div>
                      <div className="bg-sage-10 rounded-xl p-4 space-y-2">
                        <div className="h-2 bg-sage-30 rounded w-3/4"></div>
                        <div className="h-2 bg-sage-30 rounded w-full"></div>
                        <div className="h-2 bg-sage-30 rounded w-5/6"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-20 bg-sage-20 rounded-lg"></div>
                        <div className="flex-1 h-20 bg-sage-20 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                  {/* 배경 장식 */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-sage-40 rounded-full opacity-30 blur-2xl"></div>
                  <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-sage-50 rounded-full opacity-20 blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section id="features" className="py-20 bg-sage-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-sage-100">
              새김만의 특별한 기능
            </h2>
            <p className="text-lg text-sage-70 max-w-2xl mx-auto">
              AI 기술과 자연 치유의 만남으로 당신만의 특별한 감정 기록 경험을
              제공합니다
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
                      {feature.title}
                    </h3>
                    <p className="text-sage-70 text-sm leading-relaxed">
                      {feature.description}
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
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingWithSearchParams />
    </Suspense>
  );
}
