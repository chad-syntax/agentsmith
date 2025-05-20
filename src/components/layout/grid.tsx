import { cn } from '@/utils/shadcn';
import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  items?: 'start' | 'end' | 'center' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
}

export function Grid({
  children,
  className,
  cols = 12,
  gap = 4,
  items = 'stretch',
  justify = 'start',
}: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${cols}`,
        `gap-${gap}`,
        `items-${items}`,
        `justify-${justify}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// Column component for explicit column spans
interface ColProps {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export function Col({ children, className, span = 12 }: ColProps) {
  return <div className={cn(`col-span-${span}`, className)}>{children}</div>;
}
