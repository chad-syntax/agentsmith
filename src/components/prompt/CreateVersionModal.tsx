import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { incrementVersion } from '@/utils/versioning';
import { SEMVER_PATTERN } from '@/app/constants';

type CreateVersionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (version: string) => void;
  currentVersion: string;
};

export const CreateVersionModal = (props: CreateVersionModalProps) => {
  const { isOpen, onClose, onSubmit, currentVersion } = props;
  const [versionType, setVersionType] = useState<'major' | 'minor' | 'patch'>(
    'patch'
  );
  const [customVersion, setCustomVersion] = useState('');
  const [error, setError] = useState('');

  // Calculate suggested version when version type changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const suggested = incrementVersion(currentVersion, versionType);
      setCustomVersion(suggested);
      setError('');
    }
  }, [versionType, currentVersion, isOpen]);

  if (!isOpen) return null;

  const handleVersionTypeChange = (type: 'major' | 'minor' | 'patch') => {
    setVersionType(type);
  };

  const handleCustomVersionChange = (value: string) => {
    setCustomVersion(value);

    if (!SEMVER_PATTERN.test(value)) {
      setError('Version must follow semantic versioning (e.g., 1.0.0)');
    } else {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;
    onSubmit(customVersion);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Version">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Version: {currentVersion}
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Version Type
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleVersionTypeChange('major')}
              className={`px-3 py-2 rounded-md flex-1 ${
                versionType === 'major'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Major
            </button>
            <button
              type="button"
              onClick={() => handleVersionTypeChange('minor')}
              className={`px-3 py-2 rounded-md flex-1 ${
                versionType === 'minor'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Minor
            </button>
            <button
              type="button"
              onClick={() => handleVersionTypeChange('patch')}
              className={`px-3 py-2 rounded-md flex-1 ${
                versionType === 'patch'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Patch
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Version
          </label>
          <input
            type="text"
            value={customVersion}
            onChange={(e) => handleCustomVersionChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              error ? 'border-red-500' : ''
            }`}
            placeholder="0.0.0"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={!!error}
          >
            Create Version
          </button>
        </div>
      </form>
    </Modal>
  );
};
