'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { syncProject } from '@/app/actions/github';
import { RefreshCcw } from 'lucide-react';
import { cn } from '@/utils/shadcn';
import { useApp } from '@/providers/app';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

type SyncProjectButtonProps = {
  className?: string;
  onSyncComplete?: () => void;
  projectUuid?: string;
  size?: 'icon' | 'default' | 'sm' | 'lg' | null;
  children?: React.ReactNode;
};

export const SyncProjectButton = (props: SyncProjectButtonProps) => {
  const { onSyncComplete, className, projectUuid, size, children } = props;

  const { selectedProjectUuid, isSyncTooltipVisible } = useApp();
  const [isTooltipOpen, setIsTooltipOpen] = useState<boolean | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  /* in order to preserve the animation for both hover and force open
   * we need to set open property to undefined when the tooltip is not open
   */
  useEffect(() => {
    if (isSyncTooltipVisible) {
      setIsTooltipOpen(true);
    } else {
      setIsTooltipOpen(false);
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          setIsTooltipOpen(undefined);
          timeoutRef.current = null;
        }, 320);
      }
    }
  }, [isSyncTooltipVisible]);

  return (
    <Tooltip open={isTooltipOpen}>
      <TooltipTrigger asChild>
        <Button
          size={size ?? 'sm'}
          className={cn('ml-auto min-w-[58px]', size === 'icon' && 'min-w-auto size-8', className)}
          onClick={handleClick}
          variant={size === 'icon' ? 'ghost' : 'default'}
          disabled={loading}
        >
          {loading ? (
            <RefreshCcw className="animate-[spin_2s_linear_infinite_reverse]" size={16} />
          ) : (
            (children ?? 'Sync')
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="p-0 bg-background text-foreground border border-muted [&_svg]:fill-muted [&_svg]:bg-muted shadow-sm"
      >
        <p className="relative px-3 py-1.5 bg-background rounded-md z-60">Sync Changes to GitHub</p>
      </TooltipContent>
    </Tooltip>
  );
};
