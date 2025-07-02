import { createMockSupabaseClient } from './test-utils/mockSupabaseClient';

// Establish a single mock Supabase client instance that every module re-uses
const mockSupabase = createMockSupabaseClient();

// 1. Mock the `@supabase/supabase-js` package so every `createClient` call
//    returns the in-memory stub defined above.
jest.mock('@supabase/supabase-js', () => {
  return {
    __esModule: true,
    createClient: jest.fn(() => mockSupabase),
  };
});

// 2. Mock organisation/llm/vault services – the SDK only expects certain
//    methods to exist, so we can keep the implementation minimal.
jest.mock('@/lib/OrganizationsService', () => ({
  OrganizationsService: jest.fn().mockImplementation(() => ({
    getOrganizationKeySecret: jest.fn().mockResolvedValue({
      value: 'mock-openrouter-api-key',
      error: null,
    }),
    services: {},
  })),
}));

jest.mock('@/lib/LLMLogsService', () => ({
  LLMLogsService: jest.fn().mockImplementation(() => ({
    updateLogWithCompletion: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/VaultService', () => ({
  VaultService: jest.fn().mockImplementation(() => ({})),
}));

// 3. Provide a minimal implementation for constants referenced by the SDK
jest.mock('@/app/constants', () => ({
  ORGANIZATION_KEYS: { OPENROUTER_API_KEY: 'OPENROUTER_API_KEY' },
}));

// 4. Stub the generated supabase types so TypeScript doesn't complain during
//    testing. We only need the shape to exist – actual contents are irrelevant.
jest.mock('@/app/__generated__/supabase.types', () => ({
  Database: {},
}));

// 5.  Stub global `fetch` so the SDK's network requests never leave the test
//     environment. We return the bare-minimum data the SDK expects.
(global as any).fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
  // Convert the input to string for easier matching regardless of URL class or string.
  const url = typeof input === 'string' ? input : (input as any).url;

  if (url.includes('/sdk-exchange')) {
    // Exchange API key for JWT
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jwt: 'mock-jwt-token' }),
    });
  }

  if (url.includes('/chat/completions')) {
    // OpenRouter completion endpoint
    return Promise.resolve({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
      json: () =>
        Promise.resolve({
          id: 'mock-completion',
          choices: [
            {
              message: { role: 'assistant', content: 'Hello from OpenRouter!' },
            },
          ],
        }),
    });
  }

  // Default stub response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

(global as any).mockSupabase = mockSupabase;

export {};
