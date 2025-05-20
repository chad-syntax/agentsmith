import { cn } from '@/utils/shadcn';
import { ReactNode } from 'react';

interface FlexProps {
  children: ReactNode;
  className?: string;
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  items?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
}

export function Flex({
  children,
  className,
  direction = 'row',
  items = 'start',
  justify = 'start',
  wrap = 'nowrap',
  gap = 0,
}: FlexProps) {
  return (
    <div
      className={cn(
        'flex',
        `flex-${direction}`,
        `items-${items}`,
        `justify-${justify}`,
        `flex-${wrap}`,
        gap > 0 && `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}
