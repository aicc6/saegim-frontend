import CreateChat from '@/components/individual/shw/CreateChat';

export default function SessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <CreateChat sessionId={params.sessionId} />;
}
