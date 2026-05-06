// @ts-nocheck
import { type ReactNode, useCallback, useState } from 'react';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';

export type ButtonKind =
    | 'Black'
    | 'White'
    | 'Primary'
    | 'Minor'
    | 'Blur'
    | 'Text'
    | 'Danger'
    | 'Link'
    | 'Special';

export type ButtonSize = 'tiny' | 'small' | 'medium';

export interface ButtonProps {
    kind?: ButtonKind;
    size?: ButtonSize;
    children?: ReactNode;
    icon?: ReactNode;
    iconPosition?: 'left' | 'center' | 'right';
    disabled?: boolean;
    loading?: boolean;
    showLoading?: boolean;
    lightText?: boolean;
    onClick?: () => void | Promise<void>;
    onPress?: () => void | Promise<void>;
    className?: string;
    style?: React.CSSProperties;
}

// Outer press container sizing
const pressBase = 'relative w-full h-[60px] overflow-hidden cursor-pointer select-none';
const pressSizeMap: Record<ButtonSize, string> = {
    tiny:   'w-auto h-8 min-w-[60px]',
    small:  'w-auto h-9 min-w-[60px]',
    medium: 'w-auto h-12 min-w-[60px]',
};

// Inner content container border-radius
const radiusBase = 'rounded-[20px]';
const radiusSizeMap: Record<ButtonSize, string> = {
    tiny:   'rounded-[22px]',
    small:  'rounded-[30px]',
    medium: 'rounded-[30px]',
};

// Kind → background + border
const kindBgMap: Record<ButtonKind, string> = {
    Black:   'bg-text-primary',
    White:   'bg-bg-card',
    Primary: 'bg-accent',
    Minor:   'bg-white/[0.04]',
    Blur:    'bg-glass-bg backdrop-blur-md',
    Text:    'bg-transparent',
    Danger:  'bg-danger',
    Link:    'bg-transparent border border-white',
    Special: 'bg-white/[0.06]',
};

// Kind → text color
const kindTextMap: Record<ButtonKind, string> = {
    Black:   'text-bg-page',
    White:   'text-text-primary',
    Primary: 'text-text-on-accent',
    Minor:   'text-text-primary',
    Blur:    'text-text-primary',
    Text:    'text-text-primary',
    Danger:  'text-text-primary',
    Link:    'text-text-primary',
    Special: 'text-white/50',
};

// Disabled styles per kind
const kindDisabledMap: Record<ButtonKind, string> = {
    Black:   'opacity-10',
    White:   'opacity-50',
    Primary: 'opacity-50',
    Minor:   'opacity-50',
    Blur:    'opacity-50',
    Text:    'opacity-50',
    Danger:  'opacity-50',
    Link:    'opacity-50',
    Special: 'opacity-50',
};

// Text size per size variant
const textSizeMap: Record<ButtonSize, string> = {
    tiny:   'text-sm font-normal',
    small:  'text-base font-medium',
    medium: 'text-base font-medium',
};

export const Button = optimize(({
    kind = 'Black',
    size,
    children,
    icon,
    iconPosition = 'left',
    disabled,
    loading,
    showLoading,
    lightText,
    onClick,
    onPress,
    className,
    style,
}: ButtonProps) => {
    const [pending, setPending] = useState(false);

    const handleClick = useCallback(async () => {
        if (disabled || pending) return;
        const handler = onClick ?? onPress;
        if (!handler) return;
        if (showLoading) {
            setPending(true);
            try {
                await handler();
            } finally {
                setPending(false);
            }
        } else {
            await handler();
        }
    }, [disabled, pending, onClick, onPress, showLoading]);

    const isDisabled = disabled || pending || loading;
    const isTiny   = size === 'tiny';
    const isSmall  = size === 'small';
    const isMedium = size === 'medium';
    const hasSizeVariant = isTiny || isSmall || isMedium;

    const pressClass = cn(
        pressBase,
        hasSizeVariant && pressSizeMap[size!],
        className,
    );

    const innerClass = cn(
        'w-full h-full flex flex-row items-center justify-center',
        radiusBase,
        hasSizeVariant && radiusSizeMap[size!],
        kindBgMap[kind],
        isDisabled && kindDisabledMap[kind],
    );

    const textClass = cn(
        'text-lg font-semibold',
        hasSizeVariant && textSizeMap[size!],
        kindTextMap[kind],
        lightText && 'font-normal',
    );

    const iconEl = icon != null && (
        <span
            className={cn(
                'flex items-center justify-center',
                iconPosition === 'left'   && 'absolute left-[21.5px]',
                iconPosition === 'right'  && 'absolute right-[21.5px]',
                iconPosition === 'center' && 'mr-1',
            )}
        >
            {icon}
        </span>
    );

    const showSpinner = (pending || loading) && showLoading;

    return (
        <button
            type="button"
            disabled={isDisabled}
            onClick={handleClick}
            className={pressClass}
            style={style}
        >
            <div className={innerClass}>
                {showSpinner ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        {iconPosition !== 'center' && iconEl}
                        <span className={textClass}>
                            {iconPosition === 'center' && iconEl}
                            {children}
                        </span>
                    </>
                )}
            </div>
        </button>
    );
});
