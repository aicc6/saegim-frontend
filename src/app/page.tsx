import Link from 'next/link';

export default function Home() {
  return (
<<<<<<< HEAD
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
=======
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
>>>>>>> 2692b657b1409853ec30c89a04a26ee06d567b37
          </Link>
        </div>
      </main>
    </div>
  );
}
