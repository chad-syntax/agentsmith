export const routes = {
  marketing: {
    home: '/',
    landing1: '/1landing',
    landing2: '/2landing',
    landing3: '/3landing',
    privacy: '/privacy-policy',
  },
  studio: {
    home: '/studio',
    organization: (organizationUuid: string) =>
      `/studio/organization/${organizationUuid}`,
    project: (projectUuid: string) => `/studio/project/${projectUuid}`,
    prompts: (projectUuid: string) => `/studio/project/${projectUuid}/prompts`,
    promptDetail: (projectUuid: string, promptId: string) =>
      `/studio/project/${projectUuid}/prompts/${promptId}`,
    editPrompt: (projectUuid: string, promptId: string) =>
      `/studio/project/${projectUuid}/prompts/${promptId}/edit`,
    createPrompt: (projectUuid: string) =>
      `/studio/project/${projectUuid}/prompts/new`,
    logs: (projectUuid: string) => `/studio/project/${projectUuid}/logs`,
    logDetail: (projectUuid: string, logId: string) =>
      `/studio/project/${projectUuid}/logs/${logId}`,
    account: `/studio/account`,
    resetPassword: `/studio/reset-password`,
    joinOrganization: (organizationInviteCode: string) =>
      `/join/${organizationInviteCode}`,
    runPrompt: (apiVersion: string, promptUuid: string) =>
      `/api/${apiVersion}/prompts/${promptUuid}/run`,
  },
  auth: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    forgotPassword: '/forgot-password',
    callback: '/auth/callback',
  },
  error: (message: string) => `/error?message=${encodeURIComponent(message)}`,
} as const;
