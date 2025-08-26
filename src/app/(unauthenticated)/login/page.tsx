'use client';

import LoginForm from '@/components/individual/smj/LoginForm';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-background-dark transition-colors">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-10 border border-border-subtle dark:border-border-dark transition-colors">
            <LoginForm redirectTo={redirect} />
          </div>
        </div>
      </main>
    </div>
  );
}