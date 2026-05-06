import { forwardRef } from 'react';
import { cn } from '$/utils/cn';
import type { HTMLAttributes } from 'react';

export const SafeAreaView = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, style, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('flex flex-col', className)}
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                paddingLeft: 'env(safe-area-inset-left)',
                paddingRight: 'env(safe-area-inset-right)',
                ...style,
            }}
            {...props}
        />
    ),
);
SafeAreaView.displayName = 'SafeAreaView';
