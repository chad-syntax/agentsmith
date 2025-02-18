import type { NextRequest as NextRequestType } from 'next/server';
import { NextResponse } from 'next/server';

// Create a mock request function
const NextRequest = (
  url: string,
  init?: { method?: string; body?: string }
) => {
  const mockRequest = {
    url,
    method: init?.method || 'GET',
    nextUrl: new URL(url),
    cookies: new Map(),
    json: async () => (init?.body ? JSON.parse(init.body) : undefined),
  };

  return mockRequest as unknown as NextRequestType;
};

// Mock NextResponse
const mockJson = jest.fn((data, options) => ({ data, options }));

jest.mock('next/server', () => ({
  NextRequest,
  NextResponse: {
    json: mockJson,
  },
}));

export { NextRequest, mockJson };
