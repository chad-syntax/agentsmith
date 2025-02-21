'use client';

import { useParams } from 'next/navigation';
import { AgentInstanceDetail } from '@//page-components/AgentInstanceDetail';

export default function AgentInstancePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const instanceId = params.instanceId as string;

  return <AgentInstanceDetail agentId={agentId} instanceId={instanceId} />;
}
