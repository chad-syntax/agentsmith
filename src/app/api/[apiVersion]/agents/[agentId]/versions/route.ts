import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENT_VERSIONS__ } from '@//app/constants';
import type { AgentVersion } from '@//app/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string; agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const versions = Object.values(__DUMMY_AGENT_VERSIONS__).filter(
      (v: AgentVersion) => v.agentId === agentId
    );
    return NextResponse.json(versions, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent versions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string; agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    // Create new version based on current version
    const version: AgentVersion = {} as any; // Create in database
    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agent version' },
      { status: 422 }
    );
  }
}
