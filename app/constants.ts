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

export type PromptVariable = {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
};

export type Prompt = {
  id: string;
  name: string;
  content: string;
  version: string;
  variables: PromptVariable[];
  slug: string;
  model: string;
};

export type PromptMap = {
  [key: string]: Prompt;
};

export const __DUMMY_PROMPTS__: PromptMap = {
  'a1b2c3d4-e5f6-4321-8901-abcdef123456': {
    id: 'a1b2c3d4-e5f6-4321-8901-abcdef123456',
    name: 'Qualify Lead',
    slug: 'qualify_lead',
    model: 'openrouter/auto',
    content: `Based on the following information about {{ contact_name }} from their company:

{{ company_info }}

And their stated budget range:
{{ budget_range }}

Analyze their potential fit by evaluating:
- Company size and industry alignment
- Budget appropriateness
- Timeline for implementation
- Decision maker status
- Current pain points

Provide a detailed analysis of their potential value as a customer and recommend next steps.`,
    version: '1.0.0',
    variables: [
      { name: 'company_info', type: 'string', required: true },
      { name: 'contact_name', type: 'string', required: true },
      { name: 'budget_range', type: 'string', required: true },
    ],
  },
  'b2c3d4e5-f6a7-5432-9012-bcdef234567': {
    id: 'b2c3d4e5-f6a7-5432-9012-bcdef234567',
    name: 'Detect Super Qualified Lead',
    slug: 'detect_super_qualified_lead',
    model: 'openrouter/auto',
    content: `Analyze this lead for indicators of being a super-qualified prospect.

Lead Details:
{{ lead_details }}

Budget Status:
{{ budget_status }}

Technical Requirements and Stack:
{{ technical_requirements }}

Based on the above information, evaluate:
- Immediacy of their need for our solution
- Budget allocation status
- Decision maker authority level
- Technical compatibility
- Similar implementation examples

Provide a confidence score (0-100) and detailed reasoning for why this lead should be fast-tracked or not.`,
    version: '1.0.0',
    variables: [
      { name: 'lead_details', type: 'string', required: true },
      { name: 'budget_status', type: 'string', required: true },
      { name: 'technical_requirements', type: 'string', required: true },
    ],
  },
  'c3d4e5f6-g7h8-6543-0123-cdefg345678': {
    id: 'c3d4e5f6-g7h8-6543-0123-cdefg345678',
    name: 'Lead Urgency Assessment',
    slug: 'lead_urgency_assessment',
    model: 'openrouter/auto',
    content: `Current Situation:
{{ current_situation }}

Implementation Timeline:
{{ timeline }}

Competitive Landscape:
{{ competition_info }}

Based on the above information, evaluate the urgency level by analyzing:
1. Severity of current solution pain points
2. Cost implications of implementation delays
3. Competitive pressure in their market
4. Internal deadlines or initiatives
5. Risk of losing the opportunity

Provide an urgency score (1-5) and recommend specific next steps with timeline recommendations.`,
    version: '1.0.0',
    variables: [
      { name: 'current_situation', type: 'string', required: true },
      { name: 'timeline', type: 'string', required: true },
      { name: 'competition_info', type: 'string', required: true },
    ],
  },
  'd4e5f6g7-h8i9-7654-2345-defgh456789': {
    id: 'd4e5f6g7-h8i9-7654-2345-defgh456789',
    name: 'Budget Alignment Verification',
    slug: 'budget_alignment_verification',
    model: 'openrouter/auto',
    content: `Budget Details:
{{ budget_details }}

Current Solution Spend:
{{ current_spend }}

Decision Timeline:
{{ decision_timeline }}

Analyze the lead's budget alignment with our solutions by evaluating:
1. Compare current spend vs. our solution cost
2. Assess available budget allocation
3. Calculate potential ROI based on current spend
4. Evaluate payment terms flexibility
5. Review budget approval process status

Provide a budget fit score (0-100) and identify:
- Any potential financial obstacles
- Recommended pricing strategy
- Suggested payment terms
- Budget approval next steps`,
    version: '1.0.0',
    variables: [
      { name: 'budget_details', type: 'string', required: true },
      { name: 'current_spend', type: 'string', required: true },
      { name: 'decision_timeline', type: 'string', required: true },
    ],
  },
  'e5f6g7h8-i9j0-8765-3456-efghi567890': {
    id: 'e5f6g7h8-i9j0-8765-3456-efghi567890',
    name: 'Technical Fit Assessment',
    slug: 'technical_fit_assessment',
    model: 'openrouter/auto',
    content: `Current Technology Stack:
{{ tech_stack }}

Integration Requirements:
{{ integration_needs }}

Known Technical Constraints:
{{ technical_constraints }}

Evaluate the technical compatibility by analyzing:
1. Technology stack alignment with our solution
2. Complexity of required integrations
3. Technical team readiness
4. Implementation timeline feasibility
5. Impact of technical constraints

Provide:
- Technical compatibility score (0-100)
- List of potential technical blockers
- Required pre-implementation steps
- Estimated integration complexity (Low/Medium/High)
- Recommended technical implementation approach`,
    version: '1.0.0',
    variables: [
      { name: 'tech_stack', type: 'string', required: true },
      { name: 'integration_needs', type: 'string', required: true },
      { name: 'technical_constraints', type: 'string', required: true },
    ],
  },
  'b2c3d4e5-f6g7-5432-9012-bcdef234567': {
    id: 'b2c3d4e5-f6g7-5432-9012-bcdef234567',
    name: 'Default system prompt',
    slug: 'default_system_prompt',
    model: 'openrouter/auto',
    content: 'You are an AI assistant. Help the user with what they need.',
    version: '1.0.0',
    variables: [],
  },
} as const;

export const AGENT_TRIGGERS = {
  AFTER_ANY_MESSAGE: 'AFTER_ANY_MESSAGE',
  BEFORE_ANY_MESSAGE: 'BEFORE_ANY_MESSAGE',
  AFTER_USER_MESSAGE: 'AFTER_USER_MESSAGE',
  AFTER_ASSISTANT_MESSAGE: 'AFTER_ASSISTANT_MESSAGE',
  BEFORE_USER_MESSAGE: 'BEFORE_USER_MESSAGE',
  BEFORE_ASSISTANT_MESSAGE: 'BEFORE_ASSISTANT_MESSAGE',
  BEFORE_INSTANCE_CLEANUP: 'BEFORE_INSTANCE_CLEANUP',
  BEFORE_PROMPT_EXECUTION: 'BEFORE_PROMPT_EXECUTION',
  AFTER_PROMPT_EXECUTION: 'AFTER_PROMPT_EXECUTION',
  BEFORE_ACTION_EXECUTION: 'BEFORE_ACTION_EXECUTION',
  AFTER_ACTION_EXECUTION: 'AFTER_ACTION_EXECUTION',
  BEFORE_REACTION_EXECUTION: 'BEFORE_REACTION_EXECUTION',
  AFTER_REACTION_EXECUTION: 'AFTER_REACTION_EXECUTION',
  CRON_SCHEDULE: 'CRON_SCHEDULE',
} as const;

export type AgentTriggers = keyof typeof AGENT_TRIGGERS;

export type AgentTrigger = {
  type: AgentTriggers;
  cron_schedule?: string;
} & (
  | {
      type: 'CRON_SCHEDULE';
      cron_schedule: string;
    }
  | {
      type: 'BEFORE_PROMPT_EXECUTION' | 'AFTER_PROMPT_EXECUTION';
      prompt_id: string;
    }
  | {
      type: 'BEFORE_ACTION_EXECUTION' | 'AFTER_ACTION_EXECUTION';
      action_id: string;
    }
  | {
      type: 'BEFORE_REACTION_EXECUTION' | 'AFTER_REACTION_EXECUTION';
      reaction_id: string;
    }
  | {
      type: Exclude<
        AgentTriggers,
        | 'CRON_SCHEDULE'
        | 'BEFORE_PROMPT_EXECUTION'
        | 'AFTER_PROMPT_EXECUTION'
        | 'BEFORE_ACTION_EXECUTION'
        | 'AFTER_ACTION_EXECUTION'
        | 'BEFORE_REACTION_EXECUTION'
        | 'AFTER_REACTION_EXECUTION'
      >;
      cron_schedule?: never;
      prompt_id?: never;
      action_id?: never;
      reaction_id?: never;
    }
);

export type Agent = {
  id: string;
  name: string;
  slug: string;
  system_prompt_id: string;
  actions: AgentAction[];
  reactions: AgentReaction[];
};

export type AgentAction = {
  id: string;
  name: string;
  slug: string;
  prompt_id: string;
};

export type AgentReaction = {
  id: string;
  name: string;
  slug: string;
  prompt_id: string;
  triggers: AgentTrigger[];
};

export type AgentMap = {
  [key: string]: Agent;
};

export const __DUMMY_AGENTS__: AgentMap = {
  'f6g7h8i9-j0k1-9876-4567-fghij678901': {
    id: 'f6g7h8i9-j0k1-9876-4567-fghij678901',
    system_prompt_id: 'b2c3d4e5-f6g7-5432-9012-bcdef234567',
    name: 'Lead Agent',
    slug: 'lead_agent',
    actions: [
      {
        id: 'c8d9e0f1-g2h3-7654-3210-ghijkl456789',
        name: 'Qualify Lead',
        slug: 'qualify_lead',
        prompt_id: 'a1b2c3d4-e5f6-4321-8901-abcdef123456',
      },
    ],
    reactions: [
      {
        id: 'd4e5f6g7-h8i9-8765-4321-ijklmn890123',
        name: 'Detect Super Qualified Lead',
        slug: 'detect_super_qualified_lead',
        prompt_id: 'b2c3d4e5-f6a7-5432-9012-bcdef234567',
        triggers: [{ type: AGENT_TRIGGERS.AFTER_ASSISTANT_MESSAGE }],
      },
    ],
  },
} as const;
