'use client';

import LoginForm from '@/components/individual/smj/LoginForm';
import { useTheme } from '@/hooks/use-theme';

export default function LoginPage() {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen transition-colors bg-sage-10 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl shadow-2xl p-10 border transition-colors bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
