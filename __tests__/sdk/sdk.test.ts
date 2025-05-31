import { AgentsmithClient } from '../../sdk/sdk';
import { Agency } from './agentsmith.types';

describe('AgentsmithClient', () => {
  it('testing', async () => {
    const apiKey = 'sdk_3eZl3nH0lH9192OdI6DlhLNh0Xnwz3Kp';
    const projectId = '1a468eec-bba5-41a5-84ea-5e782965f7fb';

    const client = new AgentsmithClient<Agency>(apiKey, projectId);

    // should be able to compile without variables
    const helloWorldPrompt = await client.getPrompt('hello-world@0.0.1');

    const compiled = await helloWorldPrompt.compile();

    console.log('compiled', compiled);

    // should be able to compile without variables but with options
    const helloWorldPrompt2 = await client.getPrompt('hello-world@0.0.1');
    const compiled2 = await helloWorldPrompt2.compile({
      globals: {
        gitHubUrl: 'asd',
      },
    });
    console.log('compiled2', compiled2);

    // should not allow compile with variables
    const helloWorldPrompt3 = await client.getPrompt('hello-world@0.0.1');
    const compiled3 = await helloWorldPrompt3.compile({
      // userName: 'John',
    });
    console.log('compiled3', compiled3);

    // should compile with variables for 0.0.2
    const helloWorldPrompt4 = await client.getPrompt('hello-world@0.0.2');
    const compiled4 = await helloWorldPrompt4.compile({
      name: 'John',
    });
    console.log('compiled4', compiled4);

    // should compile with variables for 0.0.2 and with options
    const helloWorldPrompt5 = await client.getPrompt('hello-world@0.0.2');
    const compiled5 = await helloWorldPrompt5.compile(
      {
        name: 'John',
      },
      {
        globals: {
          gitHubUrl: 'asd',
        },
      },
    );

    console.log('compiled5', compiled5);

    const supportChatPrompt = await client.getPrompt('support-chat');

    const supportChatCompiled = await supportChatPrompt.compile(
      {
        userMessage: 'Hello, how are you?',
      },
      {
        globals: {
          companyName: 'Agentsmithiez',
        },
      },
    );

    console.log('support chat prompt metadata', supportChatPrompt.meta);
    console.log('support chat prompt version', supportChatPrompt.version);
    console.log('support chat prompt variables', supportChatPrompt.variables);

    console.log('supportChatCompiled', supportChatCompiled);
  });
});
