import { forwardRef } from 'react';
import { cn } from '$/utils/cn';
import type { HTMLAttributes } from 'react';

export interface ScrollViewProps extends HTMLAttributes<HTMLDivElement> {
    horizontal?: boolean;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    contentContainerClassName?: string;
    bounces?: boolean;
    keyboardShouldPersistTaps?: string;
    keyboardDismissMode?: string;
}

export const ScrollView = forwardRef<HTMLDivElement, ScrollViewProps>(
    ({
        className,
        horizontal,
        contentContainerClassName,
        children,
        // Filter out RN-only props that would cause DOM warnings
        showsVerticalScrollIndicator: _sv,
        showsHorizontalScrollIndicator: _sh,
        bounces: _b,
        keyboardShouldPersistTaps: _k,
        keyboardDismissMode: _kd,
        ...props
    }, ref) => (
        <div
            ref={ref}
            className={cn(
                'flex flex-col',
                horizontal ? 'overflow-x-auto overflow-y-hidden flex-row' : 'overflow-y-auto overflow-x-hidden',
                className,
            )}
            {...props}
        >
            <div className={cn('flex', horizontal ? 'flex-row' : 'flex-col', contentContainerClassName)}>
                {children}
            </div>
        </div>
    ),
);
ScrollView.displayName = 'ScrollView';
