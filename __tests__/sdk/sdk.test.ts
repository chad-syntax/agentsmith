import path from 'path';
import { AgentsmithClient } from '~/sdk/index';
import { Agency } from './agentsmith/agentsmith.types';

const agentsmithDirectory = path.join(__dirname, 'agentsmith');

// - can get prompt that is in the file system
// - can get prompt that is in the database that does not exist in the file system
// - can compile without variables for prompt that doesnt require variables
// - can compile with variables for prompt that requires variables
// - can compile with variables for prompt that requires variables and we can override the global context
// - will fail to compile at build time with type errors if we pass in wrong or missing variables
// - will fail at runtime to compile if we pass in wrong or missing variables
// - can execute prompt
// - can execute prompt with global overrides and config overrides

describe('AgentsmithClient', () => {
  it('testing', async () => {
    const startTime = performance.now();
    const apiKey = 'sdk_3eZl3nH0lH9192OdI6DlhLNh0Xnwz3Kp';
    const projectId = '1a468eec-bba5-41a5-84ea-5e782965f7fb';

    const client = new AgentsmithClient<Agency>(apiKey, projectId, {
      agentsmithDirectory,
    });

    // should be able to compile without variables
    const helloWorldPrompt = await client.getPrompt('hello-world@0.0.3');

    const compiled = await helloWorldPrompt.compile({
      firstName: 'John',
      lastName: 'Doe',
    });

    const endTime = performance.now();

    console.log('compiled', compiled);
    console.log(`Time taken: ${endTime - startTime} milliseconds`);

    const executeStartTime = performance.now();

    const response = await helloWorldPrompt.execute(
      {
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        config: {
          models: ['x-ai/grok-3-mini-beta'],
          temperature: 0.5,
        },
      },
    );

    console.log('response', response);

    const executeEndTime = performance.now();

    console.log(`Time taken: ${executeEndTime - executeStartTime} milliseconds`);

    // // should be able to compile without variables but with options
    // const helloWorldPrompt2 = await client.getPrompt('hello-world@0.0.1');
    // const compiled2 = helloWorldPrompt2.compile({
    //   globals: {
    //     gitHubUrl: 'asd',
    //   },
    // });
    // console.log('compiled2', compiled2);

    // const v1Vars: GetPromptVariables<Agency, 'hello-world@0.0.1'> = {};
    // const v2Vars: GetPromptVariables<Agency, 'hello-world@0.0.2'> = {
    //   name: 'John',
    // };
    // const v3Vars: GetPromptVariables<Agency, 'hello-world@0.0.3'> = {
    //   firstName: 'John',
    //   lastName: 'Doe',
    // };

    // const helloWorldPromptSlugs: AgencyPromptSlugs<Agency> = 'support-chat';

    // const promptIdentifier: PromptIdentifier<Agency> = 'support-chat@0.0.1';

    // // should not allow compile with variables
    // const helloWorldPrompt3 = await client.getPrompt('hello-world@0.0.1');
    // const compiled3 = helloWorldPrompt3.compile({
    //   // userName: 'John',
    // });
    // console.log('compiled3', compiled3);

    // // should compile with variables for 0.0.2
    // const helloWorldPrompt4 = await client.getPrompt('hello-world@0.0.2');
    // const compiled4 = helloWorldPrompt4.compile({
    //   name: 'John',
    // });
    // console.log('compiled4', compiled4);

    // // should compile with variables for 0.0.2 and with options
    // const helloWorldPrompt5 = await client.getPrompt('hello-world@0.0.2');
    // const compiled5 = helloWorldPrompt5.compile(
    //   {
    //     name: 'John',
    //   },
    //   {
    //     globals: {
    //       gitHubUrl: 'asd',
    //     },
    //   },
    // );

    // console.log('compiled5', compiled5);

    // const supportChatPrompt = await client.getPrompt('support-chat');

    // const supportChatCompiled = supportChatPrompt.compile(
    //   {
    //     userMessage: 'Hello, how are you?',
    //   },
    //   {
    //     globals: {
    //       companyName: 'Agentsmithiez',
    //     },
    //   },
    // );

    // console.log('support chat prompt metadata', supportChatPrompt.meta);
    // console.log('support chat prompt version', supportChatPrompt.version);
    // console.log('support chat prompt variables', supportChatPrompt.variables);

    // console.log('supportChatCompiled', supportChatCompiled);
  });
});
