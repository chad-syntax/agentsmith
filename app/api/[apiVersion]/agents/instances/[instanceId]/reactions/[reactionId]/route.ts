import { NextRequest, NextResponse } from 'next/server';
import {
  __DUMMY_AGENT_INSTANCES__,
  __DUMMY_AGENT_VERSIONS__,
} from '@/app/constants';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      apiVersion: string;
      instanceId: string;
      reactionId: string;
    }>;
  }
) {
  try {
    const { instanceId, reactionId } = await params;
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    const version = __DUMMY_AGENT_VERSIONS__[instance.agentVersionId];
    const reaction = version.reactions.find((r) => r.id === reactionId);

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reaction, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reaction details' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      apiVersion: string;
      instanceId: string;
      reactionId: string;
    }>;
  }
) {
  try {
    const { instanceId, reactionId } = await params;
    const body = await request.json();
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    const version = __DUMMY_AGENT_VERSIONS__[instance.agentVersionId];
    const reaction = version.reactions.find((r) => r.id === reactionId);

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reactionId,
        timestamp: new Date().toISOString(),
        data: body,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute reaction' },
      { status: 500 }
    );
  }
}
