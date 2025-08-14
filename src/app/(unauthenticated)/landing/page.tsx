'use client';

import Link from 'next/link';
import { Heart, Sparkles, Calendar, Shield, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden py-20 lg:py-32">
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
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/write">
                <Button
                  size="lg"
                  className="bg-sage-50 hover:bg-sage-60 text-white w-full sm:w-auto"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  지금 바로 시작하기
                </Button>
              </Link>
              <Link href="/list">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-sage-30 bg-transparent w-full sm:w-auto"
                >
                  <Play className="w-4 h-4 mr-2" />
                  기록 보기
                </Button>
              </Link>
            </div>
          </div>

          {/* 이미지/일러스트 */}
          <div className="relative">
            <div className="relative z-10">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-sage-20 shadow-xl">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sage-20 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-sage-70" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sage-100">오늘의 감정</h3>
                      <p className="text-sm text-sage-70">평온한 하루</p>
                    </div>
                  </div>
                  <div className="bg-sage-10 p-4 rounded-lg">
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
      </section>

      {/* 주요 기능 섹션 */}
      <section id="features" className="py-20 bg-white">
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
                  className="border-sage-20 hover:shadow-lg transition-shadow"
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
    </>
  );
}
