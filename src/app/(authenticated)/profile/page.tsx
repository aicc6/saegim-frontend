'use client';

import { useTheme } from 'next-themes';
import ProfileForm from '@/components/auth/ProfileForm';

export default function ProfilePage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-background-dark transition-colors">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-10 border border-border-subtle dark:border-border-dark transition-colors">
            <ProfileForm />
          </div>
        </div>
      </main>
    </div>
  );
}