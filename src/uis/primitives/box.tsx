import { forwardRef } from 'react';
import { cn } from '$/utils/cn';
import type { HTMLAttributes } from 'react';

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col', className)} {...props} />
    ),
);
Box.displayName = 'Box';
