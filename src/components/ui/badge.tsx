import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/shadcn';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        DRAFT: 'bg-yellow-700/5 text-yellow-700 border-yellow-700/50',
        PUBLISHED: 'bg-red-500/10 text-red-500 border-red-500/20',
        ARCHIVED: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        PROPOSED: 'bg-muted text-muted-foreground',
        REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
        PLANNED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
        CANCELLED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        STUDIO: 'bg-green-500/10 text-green-400 border-green-500/20',
        SDK: 'bg-yellow-600/10 text-yellow-600 border-yellow-600/20',
        AGENTSMITH_EVAL: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        AGENTSMITH_AI_AUTHOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        FREE: 'bg-gray-500/10 text-gray-700 border-gray-500/40 dark:bg-gray-700/30 dark:text-white dark:border-gray-400/60',
        HOBBY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        PRO: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        ENTERPRISE: 'bg-red-500/10 text-red-400 border-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
