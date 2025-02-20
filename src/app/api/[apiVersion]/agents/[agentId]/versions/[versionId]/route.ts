import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENT_VERSIONS__ } from '@/services/nextjs/app/constants';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ apiVersion: string; agentId: string; versionId: string }>;
  }
) {
  try {
    const { versionId } = await params;
    const version = __DUMMY_AGENT_VERSIONS__[versionId];
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    return NextResponse.json(version, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent version' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ apiVersion: string; agentId: string; versionId: string }>;
  }
) {
  try {
    const { versionId } = await params;
    const body = await request.json();
    const version = {}; // Update version in database
    return NextResponse.json(version, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent version' },
      { status: 422 }
    );
  }
}
