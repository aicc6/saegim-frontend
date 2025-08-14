'use client';

import { useAuthStore } from '@/stores/auth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { AIQuoteCard } from '@/components/landing/AIQuoteCard';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />

      <div className="flex flex-1">
        {isAuthenticated && <Sidebar />}

        <main className={`flex-1 ${isAuthenticated ? 'ml-64' : ''}`}>
          <div className="container mx-auto px-4 py-8">
            {/* 메인 콘텐츠 */}
            <div className="max-w-4xl mx-auto">
              {/* 헤더 섹션 */}
              <div className="text-center mb-12">
                <h1 className="text-h1 font-bold text-text-primary mb-4">
                  새김
                </h1>
                <p className="text-body-large text-text-secondary mb-2">
                  AI와 함께 쓰는 감성 다이어리
                </p>
                <p className="text-body text-text-placeholder">
                  당신의 마음을 깊이 새기고, AI가 아름다운 글귀로 되돌려드립니다
                </p>
              </div>

              {/* AI 글귀 카드 */}
              <AIQuoteCard className="mb-8" />

              {/* 로그인 유도 또는 환영 메시지 */}
              {!isAuthenticated ? (
                <div className="text-center mt-12 p-8 bg-background-secondary rounded-2xl border border-border-subtle">
                  <h2 className="text-h3 font-bold text-text-primary mb-4">
                    새김과 함께 시작해보세요
                  </h2>
                  <p className="text-body text-text-secondary mb-6">
                    로그인하여 나만의 감성 다이어리를 만들어보세요
                  </p>
                  <div className="flex justify-center space-x-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emotion-happy rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                        ✏️
                      </div>
                      <p className="text-body-small text-text-secondary">
                        AI 글귀 생성
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emotion-peaceful rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                        📅
                      </div>
                      <p className="text-body-small text-text-secondary">
                        감정 기록
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emotion-sad rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                        📊
                      </div>
                      <p className="text-body-small text-text-secondary">
                        월간 리포트
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center mt-12 p-8 bg-background-secondary rounded-2xl border border-border-subtle">
                  <h2 className="text-h3 font-bold text-text-primary mb-4">
                    오늘의 마음을 기록해보세요
                  </h2>
                  <p className="text-body text-text-secondary mb-6">
                    왼쪽 메뉴에서 원하는 기능을 선택하여 시작하세요
                  </p>
                  <div className="flex justify-center space-x-6">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-body-small font-medium text-text-primary">
                        글쓰기
                      </p>
                      <p className="text-caption text-text-secondary">
                        새로운 기록 작성
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="text-body-small font-medium text-text-primary">
                        캘린더
                      </p>
                      <p className="text-caption text-text-secondary">
                        월간 감정 현황
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-body-small font-medium text-text-primary">
                        글목록
                      </p>
                      <p className="text-caption text-text-secondary">
                        이전 기록 보기
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
