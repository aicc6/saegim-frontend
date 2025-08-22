'use client';

import { Suspense } from 'react';
import ProfileForm from '@/components/auth/ProfileForm';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

function ProfileFormWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-50"></div>
        </div>
      }
    >
      <ProfileForm />
    </Suspense>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background-secondary dark:bg-background-dark transition-colors">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-10 border border-border-subtle dark:border-border-dark transition-colors">
            <ProfileFormWrapper />
          </div>
        </div>
      </main>
    </div>
  );
}
