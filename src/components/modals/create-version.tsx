import { useState, useEffect } from 'react';
import { incrementVersion } from '@/utils/versioning';
import {
  SEMVER_PATTERN,
  VERSION_TYPE_DESCRIPTIONS,
  VERSION_TYPE_LABELS,
  VERSION_TYPES,
  VersionType,
} from '@/app/constants';
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
import { usePromptPage } from '@/providers/prompt-page';

export const CreateVersionModal = () => {
  const { state, handleCreateNewVersion, closeCreateVersionModal } = usePromptPage();
  const { currentVersion, isCreateVersionModalOpen: isOpen, isCreatingVersion } = state;

  const [versionType, setVersionType] = useState<VersionType>(VERSION_TYPES.patch);
  const [customVersion, setCustomVersion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (versionType !== VERSION_TYPES.custom) {
        const suggested = incrementVersion(currentVersion.version, versionType);
        setCustomVersion(suggested);
      } else {
        setCustomVersion(incrementVersion(currentVersion.version, 'patch'));
      }
      setError('');
    }
  }, [versionType, currentVersion, isOpen]);

  const handleVersionTypeChange = (type: VersionType) => {
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
    handleCreateNewVersion(versionType, customVersion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateVersionModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
          <DialogDescription>
            Choose a version type or enter a custom version number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 pb-4">
            <div className="grid gap-2">
              <Label>Current Version: {currentVersion.version}</Label>
            </div>

            <div className="grid gap-2">
              <Label>Version Type</Label>
              <div className="flex gap-2 flex-wrap">
                {Object.values(VERSION_TYPES).map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant={versionType === v ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleVersionTypeChange(v)}
                  >
                    {VERSION_TYPE_LABELS[v]}
                  </Button>
                ))}
              </div>
            </div>

            {versionType === VERSION_TYPES.custom ? (
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
            ) : (
              <div className="grid gap-2">
                <Label>New Version: {customVersion || ''}</Label>
              </div>
            )}

            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                {VERSION_TYPE_DESCRIPTIONS[versionType]}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeCreateVersionModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!error || isCreatingVersion}>
              {isCreatingVersion ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
