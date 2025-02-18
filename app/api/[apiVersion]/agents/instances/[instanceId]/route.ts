import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENT_INSTANCES__ } from '@/app/constants';

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

    return NextResponse.json(instance, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch instance data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string; instanceId: string }> }
) {
  try {
    const { instanceId } = await params;
    const body = await request.json();
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(instance, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update instance' },
      { status: 422 }
    );
  }
}

export async function DELETE(
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete instance' },
      { status: 500 }
    );
  }
}
