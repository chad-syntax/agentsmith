'use client';

import { useState } from 'react';

type PublishUpdateConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUpdating: boolean;
};

export const PublishUpdateConfirmModal = (
  props: PublishUpdateConfirmModalProps
) => {
  const { isOpen, onClose, onConfirm, isUpdating } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Update Published Version</h2>

        <div className="mb-6">
          <p className="mb-2">
            In order to test your changes, you need to update the published
            version.
          </p>
          <p className="text-amber-600">
            <strong>Warning:</strong> This will immediately update the published
            version that may be in use by your application.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Published Version'}
          </button>
        </div>
      </div>
    </div>
  );
};
