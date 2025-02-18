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
      actionId: string;
    }>;
  }
) {
  try {
    const { instanceId, actionId } = await params;
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    const version = __DUMMY_AGENT_VERSIONS__[instance.agentVersionId];
    const action = version.actions.find((a) => a.id === actionId);

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json(action, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch action details' },
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
      actionId: string;
    }>;
  }
) {
  try {
    const { instanceId, actionId } = await params;
    const body = await request.json();
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    const version = __DUMMY_AGENT_VERSIONS__[instance.agentVersionId];
    const action = version.actions.find((a) => a.id === actionId);

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        actionId,
        timestamp: new Date().toISOString(),
        data: body,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
