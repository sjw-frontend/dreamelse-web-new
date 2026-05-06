import { forwardRef } from 'react';
import { cn } from '$/utils/cn';
import type { HTMLAttributes } from 'react';

export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
    className?: string;
    numberOfLines?: number;
}

export const Text = forwardRef<HTMLSpanElement, TextProps>(
    ({ className, numberOfLines, style, ...props }, ref) => (
        <span
            ref={ref}
            className={cn('text-text-primary font-sans', className)}
            style={{
                ...(numberOfLines === 1
                    ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                    : numberOfLines != null
                    ? { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: numberOfLines, WebkitBoxOrient: 'vertical' }
                    : {}),
                ...style,
            }}
            {...props}
        />
    ),
);
Text.displayName = 'Text';
