'use client';

import { cn } from '@/utils/shadcn';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

type DisplayTimeProps = {
  dateTime: string;
  formatString?: string;
  className?: string;
  skeletonClassName?: string;
};

export const DisplayTime = (props: DisplayTimeProps) => {
  const { dateTime, formatString, className, skeletonClassName } = props;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted)
    return (
      <div
        className={cn('animate-pulse bg-muted rounded-sm w-[168px] h-[18.5px]', skeletonClassName)}
      />
    );

  const formattedDate = formatString ? format(new Date(dateTime), formatString) : dateTime;

  return (
    <time
      dateTime={dateTime}
      className={cn('inline-block animate-[fade-in_0.5s_ease-in]', className)}
    >
      {formattedDate}
    </time>
  );
};
