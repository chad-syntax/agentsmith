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
import { ArrowRight } from 'lucide-react';

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

            <div className="flex justify-around">
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <Label className="text-xs text-muted-foreground/60">Current</Label>
                  <p className="text-muted-foreground/60 text-lg">{currentVersion.version}</p>
                </div>
                <ArrowRight className="size-5 mt-3" />
                <div className="flex flex-col items-center">
                  <Label className="text-xs">New</Label>
                  <p className="text-lg">{customVersion || ''}</p>
                </div>
              </div>
            </div>

            {versionType === VERSION_TYPES.custom && (
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
            )}

            <div className="text-sm text-muted-foreground min-h-[80px] md:min-h-[60px]">
              {VERSION_TYPE_DESCRIPTIONS[versionType]}
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
