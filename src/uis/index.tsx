// @ts-nocheck
// Web stub for $/uis — maps RN-specific components to web equivalents

export { Pressable as AsyncPressable } from './primitives/pressable';
export { Image as LockAreaImage } from './primitives/image';

import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

// KeyboardControl — RN keyboard-aware scroll container, web just renders children
export const KeyboardControl: ReactTypes.FCWC = optimize(({ children, style }) => (
    <div style={style as React.CSSProperties}>{children}</div>
));

// VerticalText — RN vertical text, web uses writing-mode
export const VerticalText = optimize(({ children, style }: any) => (
    <span style={{ ...style, writingMode: 'vertical-rl' }}>{children}</span>
));

// ScrollText — scrolling marquee text
export const ScrollText = optimize(({ children, style }: any) => (
    <p style={style} className="text-text-primary">{children}</p>
));
