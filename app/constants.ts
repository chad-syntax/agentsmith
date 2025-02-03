export const tsCodeSnippet = `import { createClient } from '@chad-syntax/agentsmith'
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

export const pyCodeSnippet = `from agentsmith import create_client
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
