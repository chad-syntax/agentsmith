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
};

export type AgentAction = {
  id: string;
  name: string;
  slug: string;
  prompt_id: string;
};

export const AGENT_TRIGGERS = {
  AFTER_ANY_MESSAGE: 'AFTER_ANY_MESSAGE',
  BEFORE_ANY_MESSAGE: 'BEFORE_ANY_MESSAGE',
  AFTER_USER_MESSAGE: 'AFTER_USER_MESSAGE',
  AFTER_ASSISTANT_MESSAGE: 'AFTER_ASSISTANT_MESSAGE',
  BEFORE_USER_MESSAGE: 'BEFORE_USER_MESSAGE',
  BEFORE_ASSISTANT_MESSAGE: 'BEFORE_ASSISTANT_MESSAGE',
  BEFORE_INSTANCE_CLEANUP: 'BEFORE_INSTANCE_CLEANUP',
  CRON_SCHEDULE: 'CRON_SCHEDULE',
} as const;

export type AgentTriggers = keyof typeof AGENT_TRIGGERS;

export type AgentTrigger = {
  type: AgentTriggers;
  cron_schedule?: string;
} & (
  | {
      type: typeof AGENT_TRIGGERS.CRON_SCHEDULE;
      cron_schedule: string;
    }
  | {
      type: Exclude<AgentTriggers, typeof AGENT_TRIGGERS.CRON_SCHEDULE>;
      cron_schedule?: never;
    }
);

export type AgentReaction = {
  id: string;
  name: string;
  slug: string;
  prompt_id: string;
  triggers: AgentTrigger[];
};

export type Agent = {
  id: string;
  name: string;
  slug: string;
  system_prompt_id: string;
  actions: AgentAction[];
  reactions: AgentReaction[];
};

export type Agency = {
  prompts: {
    [key: string]: Prompt;
  };
  agents: {
    [key: string]: Agent;
  };
};
