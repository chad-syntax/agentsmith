import { useState, useEffect } from 'react';
import { incrementVersion } from '@/utils/versioning';
import { SEMVER_PATTERN } from '@/app/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/shadcn';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
          <DialogDescription>
            Choose a version type or enter a custom version number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current Version: {currentVersion}</Label>
            </div>

            <div className="grid gap-2">
              <Label>Version Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={versionType === 'major' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleVersionTypeChange('major')}
                >
                  Major
                </Button>
                <Button
                  type="button"
                  variant={versionType === 'minor' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleVersionTypeChange('minor')}
                >
                  Minor
                </Button>
                <Button
                  type="button"
                  variant={versionType === 'patch' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleVersionTypeChange('patch')}
                >
                  Patch
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="version">New Version</Label>
              <Input
                id="version"
                value={customVersion}
                onChange={(e) => handleCustomVersionChange(e.target.value)}
                placeholder="0.0.0"
                className={cn(error && 'border-destructive')}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!error}>
              Create Version
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
