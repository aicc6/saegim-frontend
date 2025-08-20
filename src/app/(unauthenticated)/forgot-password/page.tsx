'use client';

import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { useTheme } from 'next-themes';

export default function ForgotPasswordPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-background-dark transition-colors">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-10 border border-border-subtle dark:border-border-dark transition-colors">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}