import { exchangeApiKeyForJwt } from '@/lib/supabase/server-api-key';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { SdkExchangeResponse } from '@/types/api-responses';

type RequestBody = {
  apiKey: string;
};

export async function POST(request: Request) {
  logger.info('Exchanging API key for JWT');

  let body: RequestBody;
  try {
    body = await request.json();
  } catch (error) {
    logger.error(error, 'Failed to parse request body for API key exchange');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const apiKey = body.apiKey;

  if (!apiKey) {
    logger.error('No API key provided');
    return NextResponse.json({ error: 'No API key provided' }, { status: 400 });
  }

  let jwt: string | null = null;
  let expiresAt: number | null = null;

  try {
    const exchangeResult = await exchangeApiKeyForJwt(apiKey);
    jwt = exchangeResult.jwt;
    expiresAt = exchangeResult.expiresAt;
  } catch (error) {
    logger.error(error, 'Failed to exchange API key for JWT');
    return NextResponse.json(
      { error: 'Failed to exchange API key, check your SDK API key and ensure it is valid.' },
      { status: 401 },
    );
  }

  logger.info('Successfully exchanged API key for JWT');

  const response: SdkExchangeResponse = {
    jwt,
    expiresAt,
  };

  return NextResponse.json(response);
}
