'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';

type DisplayTimeProps = {
  dateTime: string;
  formatString?: string;
};

export const DisplayTime = (props: DisplayTimeProps) => {
  const { dateTime, formatString } = props;

  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(formatString ? format(new Date(dateTime), formatString) : dateTime);
  }, []);

  return <time dateTime={dateTime}>{formattedDate}</time>;
};
