import { NextRequest, NextResponse } from 'next/server';

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
    const reaction = {}; // Get reaction details from database
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
    // Execute reaction
    const result = {}; // Reaction execution result
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute reaction' },
      { status: 500 }
    );
  }
}
