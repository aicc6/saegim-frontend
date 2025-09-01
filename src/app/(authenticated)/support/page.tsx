'use client';

import SupportForm from '@/components/auth/SupportForm';

export default function SupportPage() {
  return (
    <div className="h-full bg-background-secondary dark:bg-background-dark transition-colors flex flex-col">
      <main className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
        <div className="max-w-3xl mx-auto">
          <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-10 border border-border-subtle dark:border-border-dark transition-colors">
            <SupportForm />
          </div>
        </div>
      </main>
    </div>
  );
}
