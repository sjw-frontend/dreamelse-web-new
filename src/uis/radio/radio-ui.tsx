// @ts-nocheck
import { cn } from '$/utils/cn';
import { optimize } from '$/view';

export type RadioProps = {
    checked: boolean;
    onPress?: () => void;
    style?: React.CSSProperties;
    className?: string;
    checkColor?: string;
};

export const Radio = optimize(({ checked, onPress, style, className, checkColor = 'white' }: RadioProps) => (
    <button
        type="button"
        onClick={onPress}
        className={cn(
            'w-4 h-4 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors',
            checked
                ? 'bg-accent border-2 border-accent'
                : 'bg-transparent border border-white/30',
            className,
        )}
        style={style}
    >
        {checked && (
            <svg
                width="8"
                height="8"
                viewBox="0 0 10 8"
                fill="none"
                stroke={checkColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="1,4 4,7 9,1" />
            </svg>
        )}
    </button>
));
