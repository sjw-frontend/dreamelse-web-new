import { forwardRef, useState } from 'react';
import { cn } from '$/utils/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface PressableProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'onClick'> {
    className?: string;
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    onPress?: () => void | Promise<void>;
    disabled?: boolean;
    activeOpacity?: number;
}

export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
    ({ className, children, onPress, disabled, activeOpacity = 0.7, ...props }, ref) => {
        const [pressed, setPressed] = useState(false);
        const [loading, setLoading] = useState(false);

        const handleClick = async () => {
            if (disabled || loading) return;
            setPressed(true);
            try {
                const result = onPress?.();
                if (result instanceof Promise) {
                    setLoading(true);
                    await result;
                }
            } finally {
                setPressed(false);
                setLoading(false);
            }
        };

        return (
            <button
                ref={ref}
                type="button"
                disabled={disabled || loading}
                onClick={handleClick}
                className={cn(
                    'transition-opacity duration-100 cursor-pointer',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    className,
                )}
                style={{ opacity: pressed ? activeOpacity : 1 }}
                {...props}
            >
                {typeof children === 'function' ? children({ pressed }) : children}
            </button>
        );
    },
);
Pressable.displayName = 'Pressable';
