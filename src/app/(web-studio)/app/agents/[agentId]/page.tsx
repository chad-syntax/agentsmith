import { AgentDetailPage } from '@/services/nextjs/page-components/AgentDetailPage';

export default async function AgentDetail({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  return <AgentDetailPage agentId={agentId} />;
}
