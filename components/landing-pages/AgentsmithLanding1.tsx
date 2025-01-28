const tsCodeSnippet = `import { createClient } from '@chad-syntax/agentsmith'
import Agency from '__generated__/agentsmith.types.ts';

const agentsmithClient = createClient<Agency>({ apiKey: '***' });

const greeterAgent = await agentsmithClient.getAgent('greeter_agent@1.2.3');
const agentResponse = await greeterAgent.action('greet', {
	first_name: 'Susan', // types enforced!
	last_name: 'Storm'
}, { stream: true }); // or could be false

for await (const chunk of agentResponse) {
  console.log(chunk); // { "choices": [{ "index": 0, "delta": { "role": "assistant", "content": "Hi" }]}
}
`;

const pyCodeSnippet = `from agentsmith import create_client
from agentsmith.types import Agency

# Create a typed client
agentsmith_client = create_client[Agency](api_key="***")

# Get agent with version
greeter_agent = agentsmith_client.get_agent("greeter_agent@0.0.1")

# Types are enforced in the completion parameters
agent_response = greeter_agent.action('greet',
    parameters={
        "first_name": "Susan",  # type checked!
        "last_name": "Storm"
    },
    stream=True  # or False
)

async for chunk in agent_response:
    print(chunk)  # {"choices": [{"index": 0, "delta": {"role": "assistant", "content": "Hi"}}]}
`;

export const AgentsmithLanding1 = () => {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-medium">Configure Agent</h1>
        <div className="border border-gray-200 rounded-md p-4">
          <label className="mr-4">ID: </label>
          <pre className="text-sm border border-blue-500 bg-blue-300 text-purple-900 rounded-md p-1 inline-block">
            [greeter_agent]
          </pre>
          <br />
          <label className="mr-4">Action:</label>
          <pre className="text-sm border border-blue-500 bg-blue-300 text-purple-900 rounded-md p-1 inline-block">
            [greet]
          </pre>
          <div className="border-l border-l-2 border-blue-500 pl-4">
            <div>
              <label className="mr-4">LLM:</label>
              <pre className="text-sm border border-blue-500 bg-blue-300 text-purple-900 rounded-md p-1 inline-block">
                [gpt-4o]
              </pre>
              <br />
              <label className="mr-4">Prompt:</label>
              <pre className="text-sm border border-blue-500 bg-blue-300 text-purple-900 rounded-md p-1 inline-block">
                [greet_prompt@v1.2.3]
              </pre>
              <div className="border-l border-l-2 border-blue-500 pl-4">
                <label className="mr-4">Variable (Required):</label>
                <pre className="text-sm border border-blue-500 bg-blue-300 text-purple-900 rounded-md p-1 inline-block">
                  first_name: string
                </pre>
                <br />
                <label className="mr-4">Variable (Optional):</label>
                <pre className="text-sm border border-blue-500 bg-blue-300 text-purple-900 rounded-md p-1 inline-block">
                  last_name: string
                </pre>
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-medium">Generate Types</h1>
        <div>
          <h2>TypeScript</h2>
          <pre className="border border-gray-200 rounded-md p-4">
            npx agentsmith generate-types --lang=ts --api-key=***
            ./src/__generated__/agentsmith.types.ts
          </pre>
          <br />
          <h2>Python</h2>
          <pre className="border border-gray-200 rounded-md p-4">
            npx agentsmith generate-types --lang=py --api-key=***
            ./src/__generated__/agentsmith.types.py
          </pre>
        </div>
        <h1 className="text-2xl font-medium">Run Code</h1>
        <div>
          <div>
            <h2>TypeScript</h2>
            <pre className="border border-gray-200 rounded-md p-4">
              {tsCodeSnippet}
            </pre>
          </div>
          <div>
            <h2>Python</h2>
            <pre className="border border-gray-200 rounded-md p-4">
              {pyCodeSnippet}
            </pre>
          </div>
        </div>
        <h1 className="text-2xl font-medium">View Logs and Usage</h1>
        <div>
          <p>
            Image of logs and usage mockup page. The logs would be a table like
            format with a frequency graph. The usage should show a granular
            breakdown of cost per agent or action or prompt.
          </p>
        </div>
      </div>
    </div>
  );
};
