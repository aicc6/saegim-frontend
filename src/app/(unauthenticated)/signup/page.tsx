'use client';

import SignupForm from '@/components/auth/SignupForm';
import { useTheme } from '@/hooks/use-theme';

export default function SignupPage() {
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
          {/* 회원가입 폼 컨테이너 */}
          <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200 transition-colors">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
}
