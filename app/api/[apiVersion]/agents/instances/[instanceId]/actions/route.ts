import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENT_VERSIONS__ } from '@/app/constants';
import type { AgentVersion } from '@/app/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string; instanceId: string }> }
) {
  try {
    const { instanceId } = await params;
    // For now, return actions from the first version since we don't have instance dummy data
    const firstVersion = Object.values(
      __DUMMY_AGENT_VERSIONS__
    )[0] as AgentVersion;
    return NextResponse.json(firstVersion.actions, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}
