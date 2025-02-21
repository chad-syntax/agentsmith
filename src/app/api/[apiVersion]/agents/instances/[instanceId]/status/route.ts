import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENT_INSTANCES__ } from '@//app/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string; instanceId: string }> }
) {
  try {
    const { instanceId } = await params;
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: instance.status,
        lastUpdated: instance.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
