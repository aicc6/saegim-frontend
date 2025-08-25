import CreateChat from '@/components/creatAi/CreateChat';

export default function SessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <CreateChat sessionId={params.sessionId} />;
}
