export const routes = {
  marketing: {
    home: '/',
    privacy: '/privacy-policy',
    terms: '/terms-of-service',
    waitlisted: '/waitlisted',
    checkoutLanding: '/checkout-landing',
    roadmap: (proposeModal?: boolean) => `/roadmap${proposeModal ? '?proposeModal=true' : ''}`,
    roadmapItem: (itemSlug: string) => `/roadmap/${itemSlug}`,
    demo: '/demo',
  },
  docs: {
    home: '/docs',
    selfHosting: '/docs/self-hosting',
  },
  studio: {
    home: '/studio',
    organization: (organizationUuid: string) => `/studio/organization/${organizationUuid}`,
    settings: (organizationUuid: string) => `/studio/organization/${organizationUuid}/settings`,
    editOrganization: (organizationUuid: string) => `/studio/organization/${organizationUuid}/edit`,
    organizationBilling: (organizationUuid: string) =>
      `/studio/organization/${organizationUuid}/billing`,
    organizationBillingSuccess: (organizationUuid: string) =>
      `/studio/organization/${organizationUuid}/billing/success`,
    project: (projectUuid: string) => `/studio/project/${projectUuid}`,
    editProject: (projectUuid: string) => `/studio/project/${projectUuid}/edit`,
    prompts: (projectUuid: string, openCreateModal?: boolean) =>
      `/studio/project/${projectUuid}/prompts${openCreateModal ? '?openCreateModal=true' : ''}`,
    editPrompt: (projectUuid: string, promptUuid: string) =>
      `/studio/project/${projectUuid}/prompts/${promptUuid}/edit`,
    promptDetail: (projectUuid: string, promptId: string) =>
      `/studio/project/${projectUuid}/prompts/${promptId}`,
    editPromptVersion: (projectUuid: string, promptVersionUuid: string) =>
      `/studio/project/${projectUuid}/prompts/edit/${promptVersionUuid}`,
    logs: (projectUuid: string) => `/studio/project/${projectUuid}/logs`,
    logDetail: (projectUuid: string, logId: string) =>
      `/studio/project/${projectUuid}/logs/${logId}`,
    metrics: (projectUuid: string) => `/studio/project/${projectUuid}/metrics`,
    account: `/studio/account`,
    resetPassword: `/studio/reset-password`,
    joinOrganization: (organizationInviteCode: string) => `/join/${organizationInviteCode}`,
    events: (projectUuid: string) => `/studio/project/${projectUuid}/events`,
    eventDetail: (projectUuid: string, eventUuid: string) =>
      `/studio/project/${projectUuid}/events/${eventUuid}`,
    projectGlobals: (projectUuid: string) => `/studio/project/${projectUuid}/globals`,
    alerts: '/studio/alerts',
  },
  auth: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    forgotPassword: '/forgot-password',
    callback: '/auth/callback',
  },
  api: {
    v1: {
      executePromptVersion: (promptVersionUuid: string) =>
        `/api/v1/promptVersion/${promptVersionUuid}/execute`,
      compilePromptVersion: (promptVersionUuid: string) =>
        `/api/v1/promptVersion/${promptVersionUuid}/compile`,
      sdkExchange: '/api/v1/sdk-exchange',
    },
  },
  github: {
    createInstallation: (appName: string, state: string) =>
      `https://github.com/apps/${appName}/installations/new?state=${state}`,
    installation: (installationId: number) =>
      `https://github.com/settings/installations/${installationId}`,
    repository: (repositoryFullName: string) => `https://github.com/${repositoryFullName}`,
    branch: (repositoryFullName: string, branchName: string) =>
      `https://github.com/${repositoryFullName}/tree/${branchName}`,
  },
  openrouter: {
    oauthInitiate: 'https://openrouter.ai/auth',
    authKeys: 'https://openrouter.ai/api/v1/auth/keys',
    chatCompletions: 'https://openrouter.ai/api/v1/chat/completions',
    models: 'https://openrouter.ai/api/v1/models',
    settingsKeys: 'https://openrouter.ai/settings/keys',
  },
  error: (message: string) => `/error?message=${encodeURIComponent(message)}`,
  external: {
    github: 'https://github.com/chad-syntax/agentsmith',
    npm: 'https://www.npmjs.com/package/@agentsmith-app/sdk',
    stripe: {
      checkout: (organizationUuid: string, stripePriceId: string, seats?: number) =>
        `/stripe/checkout?organizationUuid=${organizationUuid}&stripePriceId=${stripePriceId}${seats ? `&seats=${seats}` : ''}`,
      portal: (organizationUuid: string) => `/stripe/portal?organizationUuid=${organizationUuid}`,
    },
    discord: '/discord',
  },
  emails: {
    enterprise: 'mailto:enterprise@agentsmith.dev',
    support: 'mailto:support@agentsmith.dev',
    team: 'mailto:team@agentsmith.dev',
    alex: 'mailto:alex@agentsmith.dev',
  },
} as const;
