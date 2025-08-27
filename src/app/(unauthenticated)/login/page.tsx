'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import LoginForm from '@/components/individual/smj/LoginForm';

function LoginWithSearchParams() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginWithSearchParams />
    </Suspense>
  );
}
