'use client';

import type { GetOnboardingStateResult } from '&/onboarding';
import {
  IconPrompt,
  IconList,
  IconUser,
  IconPlus,
  IconChevronDown,
  IconLink,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export type WebStudioPageProps = {
  onboardingData: GetOnboardingStateResult;
};

export const WebStudioHomePage = (props: WebStudioPageProps) => {
  const { onboardingData: onboardingState } = props;

  // Extract organizations from the nested structure
  const organizations =
    onboardingState?.organization_users?.flatMap((orgUser) =>
      orgUser.organizations ? [orgUser.organizations] : []
    ) || [];

  const [selectedOrg, setSelectedOrg] = useState<number | null>(
    organizations[0]?.id || null
  );

  // Get projects for the currently selected organization
  const selectedOrgProjects = selectedOrg
    ? organizations.find((org) => org.id === selectedOrg)?.projects || []
    : [];

  const [selectedProject, setSelectedProject] = useState<number | null>(
    selectedOrgProjects[0]?.id || null
  );

  // Reset selected project when organization changes
  useEffect(() => {
    setSelectedProject(selectedOrgProjects[0]?.id || null);
  }, [selectedOrg]);

  // Check user state
  const hasOrganizations = organizations.length > 0;
  const hasProjects = selectedOrgProjects.length > 0;

  // Check if user has OpenRouter API key
  const hasOpenRouterKey = onboardingState?.user_keys?.some((key) =>
    key.key.includes('OPENROUTER_API_KEY')
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-8">Web Studio</h1>

      {/* Organization selection dropdown (if available) */}
      {hasOrganizations && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization
          </label>
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedOrg?.toString() || ''}
              onChange={(e) => setSelectedOrg(parseInt(e.target.value))}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {`Organization ${org.id}`}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <IconChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Project selection dropdown (if org selected and has projects) */}
      {hasOrganizations && selectedOrg && hasProjects && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedProject?.toString() || ''}
              onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            >
              {selectedOrgProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {`Project ${project.id}`}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <IconChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* No organization options */}
      {!hasOrganizations && (
        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">
            You're not part of any organization yet
          </h2>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center">
              <IconPlus className="w-4 h-4 mr-2" />
              Create Organization
            </button>
            <button className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              Join Organization
            </button>
          </div>
        </div>
      )}

      {/* Create project option */}
      {hasOrganizations && !hasProjects && (
        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">
            Create your first project
          </h2>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center">
            <IconPlus className="w-4 h-4 mr-2" />
            Create Project
          </button>
        </div>
      )}

      {/* Connect OpenRouter option */}
      {hasOrganizations && hasProjects && !hasOpenRouterKey && (
        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">
            Connect your OpenRouter API key
          </h2>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center">
            <IconLink className="w-4 h-4 mr-2" />
            Connect OpenRouter
          </button>
        </div>
      )}

      {/* Main interface with navigation links */}
      {hasOrganizations && hasProjects && hasOpenRouterKey && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
          <Link
            href="/studio/prompts"
            className="aspect-square bg-white rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
          >
            <div className="flex items-center justify-center flex-1">
              <IconPrompt className="w-10 h-10 text-blue-500" />
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-center">Prompts</h3>
              <p className="text-xs text-gray-500 text-center mt-0.5">
                Manage your prompt library
              </p>
            </div>
          </Link>

          <Link
            href="/studio/logs"
            className="aspect-square bg-white rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
          >
            <div className="flex items-center justify-center flex-1">
              <IconList className="w-10 h-10 text-orange-500" />
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-center">Logs</h3>
              <p className="text-xs text-gray-500 text-center mt-0.5">
                View prompt execution logs
              </p>
            </div>
          </Link>

          <Link
            href="/studio/account"
            className="aspect-square bg-white rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
          >
            <div className="flex items-center justify-center flex-1">
              <IconUser className="w-10 h-10 text-green-500" />
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-center">Account</h3>
              <p className="text-xs text-gray-500 text-center mt-0.5">
                Manage your account settings
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};
