'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { syncProject } from '@/app/actions/github';
import { IconRefresh } from '@tabler/icons-react';
import { cn } from '@/utils/shadcn';
import { useApp } from '@/app/providers/app';

type SyncProjectButtonProps = {
  className?: string;
  onSyncComplete?: () => void;
};

export const SyncProjectButton = (props: SyncProjectButtonProps) => {
  const { onSyncComplete, className } = props;

  const { selectedProjectUuid } = useApp();

  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await syncProject(selectedProjectUuid);
    setLoading(false);

    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  return (
    <Button
      size="sm"
      className={cn('ml-auto min-w-[58px]', className)}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <IconRefresh className="animate-spin" size={16} /> : 'Sync'}
    </Button>
  );
};
