'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { Database } from '@/app/__generated__/supabase.types';
import { getPromptById } from '@/lib/prompts';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import { createPromptVersion } from '@/app/actions/prompts';
import {
  PromptContentEditor,
  PromptVariable,
} from '@/components/editors/PromptContentEditor';
import { VariablesSidebar } from '@/components/prompt/VariablesSidebar';
import { PromptTestModal } from '@/components/prompt/PromptTestModal';

type NewPromptVersionPageProps = {
  prompt: NonNullable<Awaited<ReturnType<typeof getPromptById>>>;
  initialContent: string;
  initialModel: string;
  initialVariables: PromptVariable[];
  latestVersion?: string;
};

// Semver regex from the database schema
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

type VersionType = 'major' | 'minor' | 'patch';

const incrementVersion = (
  currentVersion: string,
  type: VersionType
): string => {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
};

export const NewPromptVersionPage = (props: NewPromptVersionPageProps) => {
  const router = useRouter();
  const [variables, setVariables] = useState<PromptVariable[]>(
    props.initialVariables
  );
  const [content, setContent] = useState(props.initialContent);
  const [name, setName] = useState(props.prompt.name);
  const [model, setModel] = useState(props.initialModel);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [fullResult, setFullResult] = useState<any | null>(null);
  const { selectedProjectUuid } = useApp();
  const [version, setVersion] = useState(() => {
    // Get the latest version from props and increment the patch version
    const latestVersion = props.latestVersion || '0.0.0';
    return incrementVersion(latestVersion, 'patch');
  });
  const [versionType, setVersionType] = useState<VersionType>('patch');
  const [versionError, setVersionError] = useState<string | null>(null);

  const handleVersionChange = (newVersion: string) => {
    setVersion(newVersion);
    if (!SEMVER_REGEX.test(newVersion)) {
      setVersionError('Version must follow semantic versioning (e.g., 1.0.0)');
    } else {
      setVersionError(null);
    }
  };

  const handleVersionTypeChange = (type: VersionType) => {
    setVersionType(type);
    const latestVersion = props.latestVersion || '0.0.0';
    setVersion(incrementVersion(latestVersion, type));
  };

  const handleSave = async (
    status: Database['public']['Enums']['prompt_status']
  ) => {
    if (!name.trim()) {
      alert('Please provide a name for the prompt');
      return;
    }

    if (!content.trim()) {
      alert('Please provide content for the prompt');
      return;
    }

    if (versionError) {
      alert('Please provide a valid version number');
      return;
    }

    setIsSaving(true);

    try {
      // Create a new version
      const newVersionId = await createPromptVersion({
        promptId: props.prompt.id,
        content,
        model,
        version,
        status,
        variables: variables.map((v) => ({
          name: v.name,
          type: v.type as Database['public']['Enums']['variable_type'],
          required: v.required,
        })),
      });

      if (!newVersionId) {
        throw new Error('Failed to create new version');
      }

      // Redirect back to the prompt detail page
      router.push(
        routes.studio.promptDetail(selectedProjectUuid, props.prompt.uuid)
      );
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestResult = (result: string, fullData: any) => {
    setTestResult(result);
    setFullResult(fullData);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <Link
              href={routes.studio.promptDetail(
                selectedProjectUuid,
                props.prompt.uuid
              )}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompt
            </Link>
            <div className="space-x-4">
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
              >
                <IconPlayerPlay size={16} />
                Test Prompt
              </button>
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSave('PUBLISHED')}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isSaving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={version}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    versionError ? 'border-red-500' : ''
                  }`}
                  placeholder="0.0.1"
                />
                {versionError && (
                  <p className="text-sm text-red-500">{versionError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVersionTypeChange('major')}
                    className={`px-3 py-1 rounded-md border ${
                      versionType === 'major'
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Major
                  </button>
                  <button
                    onClick={() => handleVersionTypeChange('minor')}
                    className={`px-3 py-1 rounded-md border ${
                      versionType === 'minor'
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Minor
                  </button>
                  <button
                    onClick={() => handleVersionTypeChange('patch')}
                    className={`px-3 py-1 rounded-md border ${
                      versionType === 'patch'
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Patch
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="openrouter/auto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <PromptContentEditor
                content={content}
                onContentChange={setContent}
                onVariablesChange={setVariables}
                minHeight="500px"
              />
            </div>
          </div>
        </div>
      </div>

      <VariablesSidebar
        variables={variables}
        onVariablesChange={setVariables}
      />

      <PromptTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        variables={variables}
        promptUuid={props.prompt.uuid}
        onTestResult={handleTestResult}
      />
    </div>
  );
};
