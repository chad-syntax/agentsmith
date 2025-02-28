'use client';

import type { GetUserOrganizationDataResult } from '@/lib/onboarding';
import {
  IconPrompt,
  IconList,
  IconUser,
  IconPlus,
  IconChevronDown,
  IconLink,
} from '@tabler/icons-react';
import Link from 'next/link';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { useApp } from '@/app/providers/app';
import { useState } from 'react';
import { createOrganization } from '@/app/actions/organization';

export type StudioPageProps = {
  userOrganizationData: GetUserOrganizationDataResult;
};

export const StudioHomePage = (props: StudioPageProps) => {
  const { userOrganizationData } = props;

  const {
    selectedOrganizationUuid,
    selectedOrganization,
    hasOpenRouterKey,
    isLoading,
  } = useApp();

  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Extract organizations from the nested structure
  const organizations =
    userOrganizationData?.organization_users?.flatMap((orgUser) =>
      orgUser.organizations ? [orgUser.organizations] : []
    ) || [];

  const hasOrganizations = organizations.length > 0;

  const hasProjects = (selectedOrganization?.projects.length ?? 0) > 0;

  console.log(selectedOrganization);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-8">Web Studio</h1>

      {/* Main content */}
      <main>
        {/* No organization options */}
        {!hasOrganizations && !isCreatingOrganization && (
          <div className="mt-8 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">
              You're not part of any organization yet
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setIsCreatingOrganization(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <IconPlus className="w-4 h-4 mr-2" />
                Create Organization
              </button>
              <button className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Join Organization
              </button>
            </div>
          </div>
        )}

        {isCreatingOrganization && (
          <div className="mt-8 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">
              Create a new organization
            </h2>
            <form onSubmit={() => createOrganization(organizationName)}>
              <input
                type="text"
                placeholder="Organization Name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
              <button type="submit">Create</button>
            </form>
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
        {selectedOrganizationUuid && hasProjects && !hasOpenRouterKey && (
          <div className="mt-8 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">
              Connect your OpenRouter API key
            </h2>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              onClick={() => connectOpenrouter(selectedOrganizationUuid)}
            >
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
      </main>
    </div>
  );
};
