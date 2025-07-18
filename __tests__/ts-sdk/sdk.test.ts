import fs from 'fs';
import path from 'path';
import { AgentsmithClient } from '../../ts-sdk/index';
import { ExecuteNonStreamingResult } from '../../ts-sdk/src/types';
import { Agency } from './agentsmith/agentsmith.types';

const agentsmithDirectory = path.join(__dirname, 'agentsmith');
const apiKey = 'sdk_dummy';
const projectId = 'project_dummy';

const defaultClientOptions = {
  agentsmithDirectory,
  logLevel: 'silent',
} as const;

describe('AgentsmithClient (runtime)', () => {
  let client: AgentsmithClient<Agency>;

  afterEach(async () => {
    if (client) {
      await client.shutdown();
    }
  });

  it('gets and compiles a prompt that exists on the local file system', async () => {
    client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
    const prompt = await client.getPrompt('hello-world@0.0.3');
    const { compiledPrompt, finalVariables } = await prompt.compile({
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(compiledPrompt).toContain('John');
    expect(finalVariables).toHaveProperty('firstName', 'John');
    expect(finalVariables).toHaveProperty('lastName', 'Doe');
  });

  it('compiles a prompt that requires no variables', async () => {
    client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
    const prompt = await client.getPrompt('hello-world@0.0.1');
    const { compiledPrompt } = await prompt.compile();
    expect(typeof compiledPrompt).toBe('string');
  });

  it('compiles with variables and global overrides', async () => {
    client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
    const prompt = await client.getPrompt('hello-world@0.0.2');

    const { compiledPrompt, finalVariables } = await prompt.compile(
      { name: 'John' },
      { globals: { gitHubUrl: 'https://github.com/example' } },
    );

    expect(compiledPrompt).toContain('John');
    expect(finalVariables.global.gitHubUrl).toBe('https://github.com/example');
  });

  it('throws at runtime when required variables are missing', async () => {
    client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
    const prompt = await client.getPrompt('hello-world@0.0.2');

    // Cast to any so we can bypass TS compile-time checks and test runtime behaviour
    await expect(prompt.compile({} as any)).rejects.toThrow('Missing required variables');
  });

  it('executes a prompt and returns a completion', async () => {
    client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
    const prompt = await client.getPrompt('hello-world@0.0.3');
    const result = await prompt.execute(
      { firstName: 'John', lastName: 'Doe' },
      { config: { models: ['my-model'], temperature: 0.3 } },
    );

    const nonStreamingResult = result as ExecuteNonStreamingResult;

    expect(nonStreamingResult.completion.choices[0].message.content).toBe('Hello from OpenRouter!');
    expect(nonStreamingResult.logUuid).toEqual('mock-log-uuid');
  });

  describe('Fetch Strategies', () => {
    const slug = 'db-prompt';
    const version = '0.0.1';
    let mockSupabase: jest.Mocked<any>;

    // Helper to build a chainable PostgREST query builder stub
    const createBuilder = (response: any) => {
      const b: any = {};
      const chain = () => b;
      ['select', 'eq', 'in', 'is', 'order', 'gte', 'lte'].forEach((m) => (b[m] = jest.fn(chain)));
      b.abortSignal = jest.fn(chain);
      b.single = jest.fn(async () => response);
      b.then = (resolve: any, reject: any) => Promise.resolve(response).then(resolve, reject);
      return b;
    };

    const promptVersionResponse = {
      data: {
        uuid: 'db-version-uuid',
        version,
        config: { models: ['test-model'], temperature: 1 },
        content: 'Hello {{ name }}!',
        prompt_variables: [
          {
            uuid: 'var-uuid',
            name: 'name',
            type: 'STRING',
            required: true,
            default_value: null,
          },
        ],
        prompt_includes: [],
        prompts: { uuid: 'prompt-uuid', name: 'DB Prompt', slug },
      },
      error: null,
    };

    const enoentErr = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });

    beforeEach(() => {
      mockSupabase = (global as any).mockSupabase as jest.Mocked<any>;
    });

    afterEach(() => {
      mockSupabase.from.mockClear();
      jest.restoreAllMocks();
    });

    describe('remote-fallback (default)', () => {
      let strategyClient: AgentsmithClient<Agency>;

      afterEach(async () => {
        if (strategyClient) {
          await strategyClient.shutdown();
        }
      });

      it('fetches from FS if present and does not call remote', async () => {
        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'remote-fallback',
          ...defaultClientOptions,
        });
        await strategyClient.getPrompt('hello-world@0.0.3');
        expect(mockSupabase.from).not.toHaveBeenCalled();
      });

      it('falls back to remote if not found on FS', async () => {
        const readFileSpy = jest.spyOn(fs.promises, 'readFile').mockRejectedValue(enoentErr);
        mockSupabase.from.mockImplementation((table: string) =>
          createBuilder(table === 'prompt_versions' ? promptVersionResponse : { data: {} }),
        );

        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'remote-fallback',
          ...defaultClientOptions,
        });

        const prompt = await strategyClient.getPrompt(`${slug}@${version}` as any);
        const { compiledPrompt } = await (prompt as any).compile({ name: 'John' });

        expect(readFileSpy).toHaveBeenCalled();
        expect(mockSupabase.from).toHaveBeenCalledWith('prompt_versions');
        expect(compiledPrompt).toContain('John');
      });
    });

    describe('fs-only', () => {
      let strategyClient: AgentsmithClient<Agency>;

      afterEach(async () => {
        if (strategyClient) {
          await strategyClient.shutdown();
        }
      });

      it('fetches from FS and does not fall back to remote', async () => {
        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'fs-only',
          ...defaultClientOptions,
        });
        const prompt = await strategyClient.getPrompt('hello-world@0.0.3');
        const { compiledPrompt } = await prompt.compile({
          firstName: 'John',
          lastName: 'Doe',
        });
        expect(compiledPrompt).toContain('John');
        expect(mockSupabase.from).not.toHaveBeenCalled();
      });

      it('throws if not found on FS', async () => {
        const readFileSpy = jest.spyOn(fs.promises, 'readFile').mockRejectedValue(enoentErr);

        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'fs-only',
          ...defaultClientOptions,
        });

        await expect(strategyClient.getPrompt('non-existent-prompt@0.0.1' as any)).rejects.toThrow(
          'Failed to initialize prompt non-existent-prompt from file system (fs-only strategy)',
        );
        expect(readFileSpy).toHaveBeenCalled();
        expect(mockSupabase.from).not.toHaveBeenCalled();
      });
    });

    describe('remote-only', () => {
      let strategyClient: AgentsmithClient<Agency>;

      afterEach(async () => {
        if (strategyClient) {
          await strategyClient.shutdown();
        }
      });

      it('fetches from remote and does not try FS', async () => {
        mockSupabase.from.mockImplementation((table: string) =>
          createBuilder(table === 'prompt_versions' ? promptVersionResponse : { data: {} }),
        );
        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'remote-only',
          ...defaultClientOptions,
        });

        const prompt = await strategyClient.getPrompt(`${slug}@${version}` as any);
        const { compiledPrompt } = await (prompt as any).compile({ name: 'John' });

        expect(mockSupabase.from).toHaveBeenCalledWith('prompt_versions');
        expect(compiledPrompt).toContain('John');
      });

      it('throws if not found on remote', async () => {
        mockSupabase.from.mockImplementation(() =>
          createBuilder({ data: null, error: new Error('Not found') }),
        );
        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'remote-only',
          ...defaultClientOptions,
        });

        await expect(strategyClient.getPrompt('non-existent-prompt@0.0.1' as any)).rejects.toThrow(
          'Failed to initialize prompt non-existent-prompt from remote (remote-only strategy)',
        );
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });

    describe('fs-fallback', () => {
      let strategyClient: AgentsmithClient<Agency>;

      afterEach(async () => {
        if (strategyClient) {
          await strategyClient.shutdown();
        }
      });

      it('fetches from remote if present and does not try FS', async () => {
        mockSupabase.from.mockImplementation((table: string) =>
          createBuilder(table === 'prompt_versions' ? promptVersionResponse : { data: {} }),
        );
        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'fs-fallback',
          ...defaultClientOptions,
        });

        const prompt = await strategyClient.getPrompt(`${slug}@${version}` as any);
        const { compiledPrompt } = await (prompt as any).compile({ name: 'John' });

        expect(mockSupabase.from).toHaveBeenCalledWith('prompt_versions');
        expect(compiledPrompt).toContain('John');
      });

      it('falls back to FS if not found on remote', async () => {
        mockSupabase.from.mockImplementation(() =>
          createBuilder({ data: null, error: { message: 'Not found' } }),
        );
        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'fs-fallback',
          ...defaultClientOptions,
        });

        const prompt = await strategyClient.getPrompt('hello-world@0.0.3');
        const { compiledPrompt } = await prompt.compile({
          firstName: 'John',
          lastName: 'Doe',
        });

        expect(mockSupabase.from).toHaveBeenCalled();
        expect(compiledPrompt).toContain('John');
      });

      it('throws if not found on remote or FS', async () => {
        const readFileSpy = jest.spyOn(fs.promises, 'readFile').mockRejectedValue(enoentErr);
        mockSupabase.from.mockImplementation(() =>
          createBuilder({ data: null, error: new Error('Not found') }),
        );
        strategyClient = new AgentsmithClient<Agency>(apiKey, projectId, {
          fetchStrategy: 'fs-fallback',
          ...defaultClientOptions,
        });

        await expect(strategyClient.getPrompt('non-existent-prompt@0.0.1' as any)).rejects.toThrow(
          'Failed to initialize prompt from both remote and file system',
        );
        expect(mockSupabase.from).toHaveBeenCalled();
        expect(readFileSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Compiles Included Prompts', () => {
    it('should compile a prompt with an included prompt with the latest version if no version is specified', async () => {
      client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
      const prompt = await client.getPrompt('include-prompt@0.0.1');
      const { compiledPrompt } = await prompt.compile({ foo: 'John', bar: 'Doe' });
      expect(compiledPrompt).toContain(
        'This is a prompt that includes another prompt: "included-prompt" at the latest version.\n\nIt has one variable of it\'s own: John\n\nThis is the included prompt version 0.0.2, it should be included into another prompt.\n\nIt has one variable of it\'s own: Doe',
      );
    });

    it('should compile a prompt with an included prompt with a specific version', async () => {
      client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
      const prompt = await client.getPrompt('include-prompt@0.0.2');
      const { compiledPrompt } = await prompt.compile({ foo: 'John', bar: 'Doe' });
      expect(compiledPrompt).toContain(
        'This is a prompt that includes another prompt: "included-prompt" at a specific version "0.0.1".\n\nIt has one variable of it\'s own: John\n\nThis is the included prompt version 0.0.1, it should be included into another prompt.\n\nIt has one variable of it\'s own: Doe',
      );
    });

    it('should compile a prompt with an included prompt with a specific version and an included prompt with the latest version using the "@latest" syntax', async () => {
      client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
      const prompt = await client.getPrompt('include-prompt@0.0.4');
      const { compiledPrompt } = await prompt.compile({ foo: 'John', bar: 'Doe' });
      expect(compiledPrompt).toContain(
        'This is a prompt that includes multiple prompts:\n- "included-prompt" at a specific version "0.0.1".\n- "included-prompt" at the latest version, using the "@latest" syntax.\n\nIt has one variable of it\'s own: John\n\nThis is the included prompt version 0.0.1, it should be included into another prompt.\n\nIt has one variable of it\'s own: Doe',
      );
    });

    it('should compile a prompt with multiple included prompts', async () => {
      client = new AgentsmithClient<Agency>(apiKey, projectId, defaultClientOptions);
      const prompt = await client.getPrompt('include-prompt@0.0.3');
      const { compiledPrompt } = await prompt.compile({
        foo: 'John',
        bar: 'Doe',
        userMessage: 'Hello',
      });
      expect(compiledPrompt).toContain(
        'This is a prompt that includes multiple prompts:\n- "included-prompt" at a specific version "0.0.1".\n- "support-chat" at the latest version.\n\nIt has one variable of it\'s own: John\n\nThis is the included prompt version 0.0.1, it should be included into another prompt.\n\nIt has one variable of it\'s own: Doe',
      );
      expect(compiledPrompt).toContain(
        '<role>\nYou are a senior AI support chat representative of Agentsmith.\n</role>',
      );
    });
  });
});
