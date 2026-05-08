// @ts-nocheck
// Stub barrel for dramatize-engine internal @uis

export { SmoothTypewriter } from './smooth-typewriter';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { optimize } from '$/view';

// ─── BlurBackground ───────────────────────────────────────────────────────────

interface BlurBackgroundProps {
    children?: ReactNode;
    style?: React.CSSProperties;
    borderRadius?: number;
    maskColor?: string;
    blurIntensity?: number;
}

export const BlurBackground: React.FC<BlurBackgroundProps> = optimize(({
    children, style, borderRadius = 10, maskColor = 'rgba(0,0,0,0.40)', blurIntensity = 20,
}) => (
    <div style={{
        position: 'relative',
        borderRadius,
        overflow: 'hidden',
        backdropFilter: `blur(${blurIntensity}px)`,
        WebkitBackdropFilter: `blur(${blurIntensity}px)`,
        backgroundColor: maskColor,
        ...style,
    }}>
        {children}
    </div>
));

// ─── SpotlightText ────────────────────────────────────────────────────────────

interface SpotlightTextProps {
    text: string;
    textStyle?: React.CSSProperties;
    containerStyle?: React.CSSProperties;
    spotlightWidth?: number;
    pauseMs?: number;
}

export const SpotlightText = optimize(({
    text,
    textStyle,
    containerStyle,
    spotlightWidth = 120,
}: SpotlightTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            setWidth(entries[0]?.contentRect.width ?? 0);
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const duration = width > 0 ? Math.max(1500, width * 5) : 2000;
    const animName = `spotlight-${Math.round(duration)}`;

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...containerStyle }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', ...textStyle }}>{text}</span>
            {width > 0 && (
                <div style={{
                    position: 'absolute', inset: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}>
                    <div style={{
                        position: 'absolute', top: 0, height: '100%',
                        width: spotlightWidth,
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.9), rgba(255,255,255,0.05))',
                        animation: `${animName} ${duration}ms linear infinite`,
                    }} />
                </div>
            )}
            <style>{`
                @keyframes ${animName} {
                    0%   { transform: translateX(-${spotlightWidth}px); }
                    70%  { transform: translateX(${width + spotlightWidth}px); }
                    100% { transform: translateX(${width + spotlightWidth}px); }
                }
            `}</style>
        </div>
    );
});

// ─── Countdown ────────────────────────────────────────────────────────────────

interface CountdownProps {
    duration: number;
    paused?: boolean;
    onComplete?: () => void;
}

export const Countdown = optimize(({ duration, paused = false, onComplete }: CountdownProps) => {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const bar = barRef.current;
        if (!bar) return;
        bar.style.animationPlayState = paused ? 'paused' : 'running';
    }, [paused]);

    useEffect(() => {
        const handler = () => {
            if (document.hidden && barRef.current) {
                barRef.current.style.animationPlayState = 'paused';
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, []);

    return (
        <div style={{ width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'visible', position: 'relative' }}>
            <div
                ref={barRef}
                style={{
                    height: '100%',
                    backgroundColor: '#EDEDED',
                    borderRadius: 2,
                    transformOrigin: 'left center',
                    animation: `countdown-progress ${duration}s linear forwards`,
                    animationPlayState: paused ? 'paused' : 'running',
                    position: 'relative',
                    overflow: 'visible',
                    width: 0,
                }}
                onAnimationEnd={onComplete}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: 'absolute', right: -8, top: -6.5 }}>
                    <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6" fill="#EDEDED" />
                </svg>
            </div>
            <style>{`
                @keyframes countdown-progress {
                    from { width: 0%; }
                    to   { width: 100%; }
                }
            `}</style>
        </div>
    );
});

// ─── CurvedGradientText ───────────────────────────────────────────────────────

interface GradientStop {
    color: string;
    offset: number;
}

interface CurvedGradientTextProps {
    text: string;
    curveType?: 'straight' | 'up' | 'down';
    curveIntensity?: number;
    gradientStops?: GradientStop[];
    fontSize?: number;
}

export const CurvedGradientText = optimize(({
    text,
    curveType = 'straight',
    curveIntensity = 30,
    gradientStops = [{ color: '#fff', offset: 0 }, { color: '#ABFF1A', offset: 1 }],
    fontSize = 18,
}: CurvedGradientTextProps) => {
    const id = useId();
    const width = text.length * fontSize * 0.6 + 40;
    const height = fontSize * 2 + curveIntensity;
    const midX = width / 2;
    const midY = curveType === 'up' ? curveIntensity : curveType === 'down' ? height - curveIntensity : height / 2;

    const pathD = curveType === 'straight'
        ? `M 10 ${height / 2} L ${width - 10} ${height / 2}`
        : `M 10 ${curveType === 'up' ? height - 10 : 10} Q ${midX} ${midY} ${width - 10} ${curveType === 'up' ? height - 10 : 10}`;

    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    {gradientStops.map((s, i) => (
                        <stop key={i} offset={`${s.offset * 100}%`} stopColor={s.color} />
                    ))}
                </linearGradient>
                <path id={`curve-${id}`} d={pathD} />
            </defs>
            <text fontSize={fontSize} fontWeight="bold" fill={`url(#grad-${id})`}>
                <textPath href={`#curve-${id}`} startOffset="50%" textAnchor="middle">
                    {text}
                </textPath>
            </text>
        </svg>
    );
});

// ─── MarqueeText (internal) ───────────────────────────────────────────────────

const MarqueeText = ({ children, style }: { children: string; style?: React.CSSProperties }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const text = textRef.current;
        if (!container || !text) return;
        setShouldScroll(text.scrollWidth > container.clientWidth);
    }, [children]);

    return (
        <div ref={containerRef} style={{ overflow: 'hidden', flex: 1, ...style }}>
            <span
                ref={textRef}
                style={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    animation: shouldScroll ? 'marquee-text 6s linear infinite' : 'none',
                }}
            >
                {children}
            </span>
            <style>{`
                @keyframes marquee-text {
                    0%   { transform: translateX(0); }
                    40%  { transform: translateX(calc(-100% + 200px)); }
                    60%  { transform: translateX(calc(-100% + 200px)); }
                    100% { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

// ─── OptionList ───────────────────────────────────────────────────────────────

interface OptionItem {
    id?: string;
    text?: string;
    label?: string;
    value?: string;
}

interface OptionListProps {
    options?: OptionItem[];
    selectedId?: string;
    interactive?: boolean;
    onPress?: (option: OptionItem, index: number) => void;
    onSelect?: (option: OptionItem) => void;
}

export const OptionList = optimize(({
    options, selectedId, interactive = true, onPress, onSelect,
}: OptionListProps) => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {options?.map((option, index) => {
            const isSelected = selectedId === option.id;
            return (
                <button
                    key={option.id ?? index}
                    type="button"
                    disabled={!interactive}
                    onClick={() => {
                        onPress?.(option, index);
                        onSelect?.(option);
                    }}
                    style={{
                        width: '100%', height: 60,
                        borderRadius: 20,
                        border: isSelected ? '2px solid #EDEDED' : '0.5px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        boxShadow: 'inset 0 0 30px rgba(255,255,255,0.15)',
                        cursor: interactive ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center',
                        padding: '0 12px',
                        overflow: 'hidden',
                    }}
                >
                    <MarqueeText style={{ fontSize: 18, fontWeight: 500, color: '#EDEDED' }}>
                        {option.text ?? option.label ?? option.value ?? ''}
                    </MarqueeText>
                </button>
            );
        })}
    </div>
));
