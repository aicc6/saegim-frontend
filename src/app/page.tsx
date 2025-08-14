import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background-primary">
      <main className="container mx-auto p-4">
        <h1 className="text-h1 text-text-primary text-center">새김</h1>
        <p className="text-body text-text-secondary text-center mt-2">
          AI와 함께 쓰는 감성 다이어리
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/CreateAi"
            className="rounded-xl bg-interactive-primary px-5 py-3 font-semibold text-text-on-color hover:bg-interactive-primary-hover active:bg-interactive-primary-active"
          >
            AI 글 생성하기
          </Link>
        </div>
      </main>
    </div>
  );
}
