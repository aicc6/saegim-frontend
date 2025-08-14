'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useTheme } from '@/hooks/use-theme';

export default function LoginPage() {
  const { isDark } = useTheme();

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        backgroundColor: isDark ? '#111827' : '#e5f0ef',
      }}
    >
      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* 로그인 폼 컨테이너 */}
          <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200 transition-colors">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
