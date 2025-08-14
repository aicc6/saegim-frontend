<<<<<<< HEAD
import CreateAi from '@CreateAi';

export default function CreateAiPage() {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <main className="w-full max-w-2xl px-4 py-10 animate-page-transition">
        <CreateAi />
      </main>
=======
import CreateAi from '@/components/CreateAi';
import Header from '@/components/Header';

export default function CreateAiPage() {
  return (
    <div>
      <Header />
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <main className="w-full max-w-2xl px-4 py-10 animate-page-transition">
          <CreateAi />
        </main>
      </div>
>>>>>>> 2692b657b1409853ec30c89a04a26ee06d567b37
    </div>
  );
}
