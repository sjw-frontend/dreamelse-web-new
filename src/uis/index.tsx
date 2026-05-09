// @ts-nocheck
// Web stub for $/uis — maps RN-specific components to web equivalents

export { Pressable as AsyncPressable } from './primitives/pressable';
export { Image as LockAreaImage } from './primitives/image';
export { Dialog } from './dialog/dialog-ui';
export type { DialogProps, DialogButton } from './dialog/dialog-ui';

import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

// KeyboardControl — RN keyboard-aware scroll container, web just renders children
export const KeyboardControl: ReactTypes.FCWC = optimize(({ children, style }) => (
    <div style={style as React.CSSProperties}>{children}</div>
));

// VerticalText — RN vertical text, web uses writing-mode
export const VerticalText = optimize(({ text, containerStyle, textStyle }: { text?: string; children?: string; containerStyle?: React.CSSProperties; textStyle?: React.CSSProperties }) => (
    <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', ...containerStyle }}>
        <span style={textStyle}>{text}</span>
    </div>
));

// ScrollText — horizontal marquee
export const ScrollText = optimize(({ text, style }: { text?: string; children?: string; style?: React.CSSProperties }) => (
    <div style={{ overflow: 'hidden', ...style }}>
        <span style={{
            display: 'inline-block', whiteSpace: 'nowrap',
            animation: 'scroll-text 8s linear infinite',
        }}>
            {text}&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </span>
        <style>{`@keyframes scroll-text { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
));
