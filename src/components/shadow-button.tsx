'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/shadcn';
import { useEffect, useRef, useState } from 'react';
import { Button, buttonVariants } from './ui/button';

const shadowButtonVariants = cva(
  'text-foreground border border-white/20 bg-white/20 backdrop-blur-[20px] backdrop-saturate-120',
  {
    variants: {
      variant: {
        default: 'hover:bg-white/20 hover:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const SHADOW_BUTTON_ANIMATION_DURATION = 300;

export const ShadowButton = ({
  children,
  variant,
  size,
  className,
  active,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  } & VariantProps<typeof shadowButtonVariants> & {
    asChild?: boolean;
  } & {
    active?: boolean;
  }) => {
  const [_active, _setActive] = useState(active ?? false);
  const [_animationClassName, _setAnimationClassName] = useState('');
  const [_activeClassName, _setActiveClassName] = useState(
    active ? 'shadow-button-shadow-in' : 'shadow-button-shadow-out',
  );
  const isAnimatingRef = useRef(false);
  const activeRef = useRef<boolean>(Boolean(active));

  useEffect(() => {
    if (activeRef.current === active) return;
    activeRef.current = Boolean(active);

    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    if (active === true) {
      _setAnimationClassName('animate-shadow-out-to-in');
      setTimeout(() => {
        _setActiveClassName('shadow-button-shadow-in');
      }, SHADOW_BUTTON_ANIMATION_DURATION - 5);
    } else {
      _setAnimationClassName('animate-shadow-in-to-out');
      setTimeout(() => {
        _setActiveClassName('shadow-button-shadow-out');
      }, SHADOW_BUTTON_ANIMATION_DURATION - 5);
    }

    setTimeout(() => {
      isAnimatingRef.current = false;
    }, SHADOW_BUTTON_ANIMATION_DURATION);
  }, [active]);

  return (
    <Button
      className={cn(
        buttonVariants({ variant, size, className }),
        shadowButtonVariants({ variant, className }),
        _animationClassName,
        _activeClassName,
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
