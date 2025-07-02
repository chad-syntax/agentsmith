export const installSdk = `npm install @agentsmith-app/sdk`;

export const sdkUsage = (projectId: string) => `
// src/file.ts
import { AgentsmithClient } from '@agentsmith-app/sdk';
import { Agency } from '../agentsmith/agentsmith.types';

const agentsmithClient = new AgentsmithClient<Agency>('sdk_********************************', '${projectId}');

const helloWorldPrompt = await agentsmithClient.getPrompt('hello-world@0.0.1');

const compiledPrompt = helloWorldPrompt.compile({
  name: 'John',
});
`;
