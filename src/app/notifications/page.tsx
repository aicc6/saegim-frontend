'use client';

import { useAuthStore } from '@/stores/auth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-h2 text-text-primary mb-4">
              로그인이 필요합니다
            </h1>
            <p className="text-body text-text-secondary">
              알림을 보려면 먼저 로그인해주세요.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 ml-64">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto">
              {/* 페이지 헤더 */}
              <div className="mb-8">
                <h1 className="text-h2 font-bold text-text-primary mb-2">
                  알림
                </h1>
                <p className="text-body text-text-secondary">
                  중요한 소식과 알림을 확인하세요
                </p>
              </div>

              {/* 기능 준비중 메시지 */}
              <div className="bg-background-secondary rounded-2xl border border-border-subtle p-12 text-center">
                <div className="text-6xl mb-6">🔔</div>
                <h2 className="text-h3 font-bold text-text-primary mb-4">
                  알림 기능 준비중
                </h2>
                <p className="text-body text-text-secondary mb-6">
                  일기 작성 알림, 월간 리포트 등 다양한 알림 기능을 준비하고
                  있습니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="p-4 bg-background-primary rounded-lg border border-border-subtle">
                    <div className="text-2xl mb-2">⏰</div>
                    <h3 className="text-body font-medium text-text-primary mb-1">
                      일기 알림
                    </h3>
                    <p className="text-caption text-text-secondary">
                      정기적인 일기 작성 알림
                    </p>
                  </div>
                  <div className="p-4 bg-background-primary rounded-lg border border-border-subtle">
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="text-body font-medium text-text-primary mb-1">
                      월간 리포트
                    </h3>
                    <p className="text-caption text-text-secondary">
                      감정 분석 리포트 알림
                    </p>
                  </div>
                  <div className="p-4 bg-background-primary rounded-lg border border-border-subtle">
                    <div className="text-2xl mb-2">🎉</div>
                    <h3 className="text-body font-medium text-text-primary mb-1">
                      특별 소식
                    </h3>
                    <p className="text-caption text-text-secondary">
                      새로운 기능 업데이트
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
