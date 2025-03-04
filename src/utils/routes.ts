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
    editOrganization: (organizationUuid: string) =>
      `/studio/organization/${organizationUuid}/edit`,
    project: (projectUuid: string) => `/studio/project/${projectUuid}`,
    editProject: (projectUuid: string) => `/studio/project/${projectUuid}/edit`,
    prompts: (projectUuid: string) => `/studio/project/${projectUuid}/prompts`,
    promptDetail: (projectUuid: string, promptId: string) =>
      `/studio/project/${projectUuid}/prompts/${promptId}`,
    editPromptVersion: (projectUuid: string, promptVersionUuid: string) =>
      `/studio/project/${projectUuid}/prompts/edit/${promptVersionUuid}`,
    logs: (projectUuid: string) => `/studio/project/${projectUuid}/logs`,
    logDetail: (projectUuid: string, logId: string) =>
      `/studio/project/${projectUuid}/logs/${logId}`,
    account: `/studio/account`,
    resetPassword: `/studio/reset-password`,
    joinOrganization: (organizationInviteCode: string) =>
      `/join/${organizationInviteCode}`,
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
    },
  },
  error: (message: string) => `/error?message=${encodeURIComponent(message)}`,
} as const;
