import { cn } from '$/utils/cn';

export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    className?: string;
}

export const ActivityIndicator = ({ size = 'small', color, className }: ActivityIndicatorProps) => {
    const sizeClass = size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-8 h-8' : '';
    const sizeStyle = typeof size === 'number' ? { width: size, height: size } : {};

    return (
        <div
            className={cn(
                'rounded-full border-2 border-transparent animate-spin',
                sizeClass,
                className,
            )}
            style={{ borderTopColor: color ?? 'var(--color-accent)', ...sizeStyle }}
        />
    );
};
