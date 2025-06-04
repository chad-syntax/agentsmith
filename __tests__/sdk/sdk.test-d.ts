import { expectType, expectError } from 'tsd';
import path from 'path';

import { AgentsmithClient } from '../../sdk/index';
import { Agency } from './agentsmith/agentsmith.types';

const agentsmithDirectory = path.join(__dirname, 'agentsmith');

const client = new AgentsmithClient<Agency>('sdk_dummy', 'project_dummy', {
  agentsmithDirectory,
});

(async () => {
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
})();
