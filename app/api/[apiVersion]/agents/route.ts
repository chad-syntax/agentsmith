import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENTS__, Agent, AgentVersion } from '@/app/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string }> }
) {
  try {
    const { apiVersion } = await params;
    const agents = Object.values(__DUMMY_AGENTS__);
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string }> }
) {
  try {
    const { apiVersion } = await params;
    const body = await request.json();
    // Create both the agent and its first version
    const agent: Agent = {} as any; // Create agent in database
    const version: AgentVersion = {} as any; // Create initial version
    return NextResponse.json({ agent, version }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 422 }
    );
  }
}
