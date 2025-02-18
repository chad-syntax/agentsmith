import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENTS__, __DUMMY_AGENT_VERSIONS__ } from '@/app/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; apiVersion: string }> }
) {
  try {
    const { agentId } = await params;
    const requestedVersion = request.nextUrl.searchParams.get('version');

    const agent = __DUMMY_AGENTS__[agentId];
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (requestedVersion) {
      // Find version by semver
      const version = Object.values(__DUMMY_AGENT_VERSIONS__).find(
        (v) => v.agentId === agentId && v.version === requestedVersion
      );
      if (!version) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(version, { status: 200 });
    }

    // Return latest version by default
    const currentVersion = __DUMMY_AGENT_VERSIONS__[agent.currentVersionId];
    return NextResponse.json({ ...agent, ...currentVersion }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; apiVersion: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    // TODO: Validate body
    const agent = {}; // Update in database
    return NextResponse.json(agent, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 422 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; apiVersion: string }> }
) {
  try {
    const { agentId } = await params;
    // Delete from database
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
