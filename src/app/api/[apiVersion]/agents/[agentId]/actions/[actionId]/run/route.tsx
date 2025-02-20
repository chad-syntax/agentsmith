import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ apiVersion: string; agentId: string; actionId: string }>;
  }
) {
  const { agentId, actionId } = await params;
  return NextResponse.json({ message: 'Hello World' });
}
