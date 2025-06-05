'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { syncProject } from '@/app/actions/github';
import { RefreshCcw } from 'lucide-react';
import { cn } from '@/utils/shadcn';
import { useApp } from '@/providers/app';
import { toast } from 'sonner';

type SyncProjectButtonProps = {
  className?: string;
  onSyncComplete?: () => void;
  projectUuid?: string;
  size?: 'icon' | 'default' | 'sm' | 'lg' | null;
  children?: React.ReactNode;
};

export const SyncProjectButton = (props: SyncProjectButtonProps) => {
  const { onSyncComplete, className, projectUuid, size, children } = props;

  const { selectedProjectUuid } = useApp();
  const targetProjectUuid = projectUuid ?? selectedProjectUuid;

  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await syncProject(targetProjectUuid);

      if (result.data?.status === 'sync_in_progress') {
        toast.warning('Sync already in progress.');
        return;
      }
    } catch (error: any) {
      toast.error('Failed to sync project', {
        description: error?.message,
      });
    } finally {
      setLoading(false);
    }

    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  return (
    <Button
      size={size ?? 'sm'}
      className={cn('ml-auto min-w-[58px]', className)}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <RefreshCcw className="animate-[spin_2s_linear_infinite_reverse]" size={16} />
      ) : (
        (children ?? 'Sync')
      )}
    </Button>
  );
};
