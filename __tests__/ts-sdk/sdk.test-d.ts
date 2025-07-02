import { expectType, expectError } from 'tsd';
import path from 'path';

import { AgentsmithClient } from '../../ts-sdk/index';
import { Agency } from './agentsmith/agentsmith.types';

const agentsmithDirectory = path.join(__dirname, 'agentsmith');

const client = new AgentsmithClient<Agency>('sdk_dummy', 'project_dummy', {
  agentsmithDirectory,
});

(async () => {
  // ------------------------------------------
  // Testing Prompt Variables
  // ------------------------------------------
  const prompt = await client.getPrompt('hello-world@0.0.3');

  // ------------------------------------------
  // VALID usages – should compile
  // ------------------------------------------
  expectType<Awaited<ReturnType<typeof prompt.compile>>>(
    await prompt.compile({
      firstName: 'John',
      lastName: 'Doe',
    }),
  );

  // ------------------------------------------
  // INVALID usages – tsd should flag errors
  // ------------------------------------------
  await expectError(
    prompt.compile({
      firstName: 'John', // missing lastName
    }),
  );

  await expectError(
    prompt.compile({
      name: 'John', // wrong property
    }),
  );

  await expectError(
    prompt.compile({
      firstName: 'John',
      lastName: 'Doe',
      age: 30 as any, // extra property
    }),
  );

  // ------------------------------------------
  // Testing Unpublished Prompt
  // ------------------------------------------

  // ------------------------------------------
  // VALID usages – should compile
  // ------------------------------------------
  expectType<Awaited<ReturnType<typeof client.getPrompt>>>(
    await client.getPrompt('unpublished-prompt@0.0.1'),
  );

  // ------------------------------------------
  // INVALID usages – tsd should flag errors
  // ------------------------------------------
  await expectError(client.getPrompt('unpublished-prompt')); // has no published version, therefore cannot get latest

  // ------------------------------------------
  // Testing Execute Result
  // ------------------------------------------
  const streamingPrompt = await client.getPrompt('streaming-prompt@0.0.1');

  // By default, should be streaming
  const streamingResult = await streamingPrompt.execute();
  expectType<AsyncGenerator<string | undefined, void, unknown>>(streamingResult.tokens);
  await expectError(streamingResult.completion);

  // When overridden, should be non-streaming
  const nonStreamingResultFromStreaming = await streamingPrompt.execute(
    {},
    { config: { stream: false } },
  );
  expectType<any>(nonStreamingResultFromStreaming.completion);
  await expectError(nonStreamingResultFromStreaming.tokens);

  const nonStreamingPrompt = await client.getPrompt('non-streaming-prompt@0.0.1');

  // By default, should be non-streaming
  const nonStreamingResult = await nonStreamingPrompt.execute({});
  expectType<any>(nonStreamingResult.completion);
  await expectError(nonStreamingResult.tokens);

  // When overridden, should be streaming
  const streamingResultFromNonStreaming = await nonStreamingPrompt.execute(
    {},
    { config: { stream: true } },
  );
  expectType<AsyncGenerator<string | undefined, void, unknown>>(
    streamingResultFromNonStreaming.tokens,
  );
  await expectError(streamingResultFromNonStreaming.completion);
})();
