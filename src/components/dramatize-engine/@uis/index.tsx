// @ts-nocheck
// Stub barrel for dramatize-engine internal @uis

export { SmoothTypewriter } from './smooth-typewriter';

import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

export const BlurBackground: ReactTypes.FCWC = optimize(({ children, style }) => (
    <div style={style as React.CSSProperties} className="backdrop-blur-sm">{children}</div>
));

export const OptionList = optimize(({ options, onSelect }: any) => (
    <div className="flex flex-col gap-2 w-full">
        {options?.map((opt: any, i: number) => (
            <button
                key={i}
                type="button"
                className="w-full py-3 px-4 rounded-2xl text-left text-text-primary font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', fontSize: 16 }}
                onClick={() => onSelect?.(opt)}
            >
                {opt.label ?? opt.value}
            </button>
        ))}
    </div>
));

export const CurvedGradientText = optimize(({ text }: { text: string }) => (
    <span className="text-text-primary font-bold text-lg">{text}</span>
));

export const SpotlightText = optimize(({ text }: { text: string }) => (
    <span className="text-text-primary opacity-70 text-base font-medium">{text}</span>
));

export const Countdown = optimize(({ seconds, onEnd }: any) => {
    const [left, setLeft] = React.useState(seconds ?? 0);
    React.useEffect(() => {
        if (left <= 0) { onEnd?.(); return; }
        const t = setTimeout(() => setLeft((v: number) => v - 1), 1000);
        return () => clearTimeout(t);
    }, [left]);
    return <span className="text-text-primary text-sm opacity-70">{left}s</span>;
});
