// web版：Reanimated → web animation stubs
import { useCallback, useRef } from 'react';

export type AnimationDriverConfig = LibTypes.Define<{
    sharedValue: { value: number };
    fromValue?: number;
    toValue: number;
    duration: number;
    easing?: (t: number) => number;
    onComplete?: () => void;
}>;

export const useAnimationDriver = (config: AnimationDriverConfig) => {
    const rafRef = useRef<number | null>(null);

    const start = useCallback(() => {
        const { sharedValue, fromValue, toValue, duration, easing, onComplete } = config;
        const startVal = fromValue ?? sharedValue.value;
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const easedT = easing ? easing(t) : t;
            sharedValue.value = startVal + (toValue - startVal) * easedT;
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                onComplete?.();
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [config]);

    const stop = useCallback(() => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    }, []);

    return { start, stop };
};
