'use client';

import { ChevronUp, Command, Option } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/shadcn';

export const MetaKeyIcon = (props: React.SVGProps<SVGSVGElement>) => {
  const [platform, setPlatform] = useState('mac');

  useEffect(() => {
    setPlatform(
      typeof window !== 'undefined'
        ? /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
          ? 'mac'
          : 'win'
        : 'mac',
    );
  }, []);

  return platform === 'mac' ? <Command {...props} /> : <ChevronUp {...props} />;
};

export const AltKeyIcon = (props: any) => {
  const [platform, setPlatform] = useState('mac');

  useEffect(() => {
    setPlatform(
      typeof window !== 'undefined'
        ? /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
          ? 'mac'
          : 'win'
        : 'mac',
    );
  }, []);

  return platform === 'mac' ? (
    <Option {...props} />
  ) : (
    <span
      {...props}
      className={cn(
        props.className,
        'border border-border rounded-sm tracking-tighter px-1 py-0.5 text-xs group-hover:border-background size-auto',
      )}
    >
      Alt
    </span>
  );
};
