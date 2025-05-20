import { cn } from '@/utils/shadcn';
import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Section({ children, className, size = 'md' }: SectionProps) {
  const sizeClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
    xl: 'py-16',
  };

  return (
    <section className={cn(sizeClasses[size], className)}>{children}</section>
  );
}
