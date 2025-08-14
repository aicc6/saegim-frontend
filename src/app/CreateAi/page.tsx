import CreateAi from '@/components/CreateAi';

export default function CreateAiPage() {
  return (
    <div>
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <main className="w-full max-w-2xl px-4 py-10 animate-page-transition">
          <CreateAi />
        </main>
      </div>
    </div>
  );
}
