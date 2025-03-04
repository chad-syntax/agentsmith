'use client';

import { useState } from 'react';
import { createPromptWithDraftVersion } from '@/app/actions/prompts';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';

type CreatePromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
};

export const CreatePromptModal = (props: CreatePromptModalProps) => {
  const { isOpen, onClose, projectId } = props;
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { selectedProjectUuid } = useApp();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please provide a name for the prompt');
      return;
    }

    setIsCreating(true);

    try {
      const { promptUuid, versionUuid } = await createPromptWithDraftVersion({
        name,
        projectId,
      });

      // Redirect to the edit page for the new draft version
      router.push(
        routes.studio.editPromptVersion(selectedProjectUuid, versionUuid)
      );
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Failed to create prompt. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Prompt</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter prompt name"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create & Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
