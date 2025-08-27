import CreateChat from '@/components/creatAi/CreateChat';

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;
  return <CreateChat sessionId={sessionId} />;
}
