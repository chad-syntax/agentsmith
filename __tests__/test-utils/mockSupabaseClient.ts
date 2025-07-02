import { jest } from '@jest/globals';

export const createMockSupabaseClient = () => {
  type SupabaseResponse<T = any> = { data: T; error: any };

  const createQueryBuilder = <T = any>(response: SupabaseResponse<T>) => {
    const builder: any = {};
    const chain = jest.fn(() => builder);
    builder.select = chain;
    builder.eq = chain;
    builder.in = chain;
    builder.is = chain;
    builder.order = chain;
    builder.gte = chain;
    builder.lte = chain;
    builder.single = jest.fn(async () => response);
    builder.then = (resolve: any, reject: any) => Promise.resolve(response).then(resolve, reject);
    return builder;
  };

  const defaultResponse: SupabaseResponse = { data: null, error: null };
  const genericBuilder = createQueryBuilder(defaultResponse);

  return {
    from: jest.fn(() => genericBuilder),
    rpc: jest.fn(async (procedure: string) => {
      if (procedure === 'create_llm_log_entry') {
        return {
          data: { log_uuid: 'mock-log-uuid', organization_uuid: 'mock-org-uuid' },
          error: null,
        } as SupabaseResponse;
      }
      return { data: null, error: null } as SupabaseResponse;
    }),
    realtime: {
      disconnect: jest.fn(),
    },
    auth: {
      signOut: jest.fn(),
    },
  };
};
