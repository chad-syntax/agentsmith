'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';

type DisplayTimeProps = {
  dateTime: string;
  formatString?: string;
};

export const DisplayTime = (props: DisplayTimeProps) => {
  const { dateTime, formatString } = props;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedDate = formatString ? format(new Date(dateTime), formatString) : dateTime;

  return (
    <time dateTime={dateTime} className={!isMounted ? 'opacity-0' : ''}>
      {formattedDate}
    </time>
  );
};
