import { NextRequest, NextResponse } from 'next/server';
import {
  __DUMMY_AGENT_INSTANCES__,
  AgentInstance,
} from '@/services/nextjs/app/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ apiVersion: string; agentId: string }> }
) {
  try {
    const { agentId } = await params;

    // Filter instances by agentId
    const instances = Object.values(__DUMMY_AGENT_INSTANCES__).filter(
      (instance) => instance.agentId === agentId
    );

    if (instances.length === 0) {
      return NextResponse.json(
        { error: 'No instances found for this agent' },
        { status: 404 }
      );
    }

    return NextResponse.json(instances, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apiVersion: string; agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();

    // Get version from body or query param, or use latest
    const version = body.version || '1.0.0'; // request.nextUrl.searchParams.get('version');
    // const versionedAgentId = version
    //   ? await getVersionedAgentId(agentId, version)
    //   : await getLatestVersionedAgentId(agentId);

    const versionedAgentId = `${agentId}_${version}`;

    const instance: AgentInstance = {
      id: versionedAgentId,
      agentId,
      agentVersionId: 'asd',
      name: body.name,
      status: 'active',
      state: {},
      ctx: body.ctx || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 422 }
    );
  }
}
