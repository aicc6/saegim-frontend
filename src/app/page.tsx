import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <main className="w-full max-w-xl px-4 py-10 animate-page-transition text-center">
        <h1 className="text-h1 font-bold text-sage-100">새김</h1>
        <p className="mt-2 text-body text-text-primary">감성 AI 글쓰기 도구</p>
        <div className="mt-6">
          <Link
            href="/CreateAi"
            className="inline-block rounded-xl bg-sage-50 px-6 py-3 text-body-large font-semibold hover:bg-sage-60 active:bg-sage-70"
          >
            글 생성 하기
          </Link>
        </div>
      </main>
    </div>
  );
}
