import React, { useEffect, useRef, useState } from 'react';

import { optimize } from '$/view';

import { Settings } from './smooth-typewriter-const';
import type { SmoothTypewriterProps } from './smooth-typewriter-ui';

export const SmoothTypewriter: React.FC<SmoothTypewriterProps> = optimize(
    ({
        play,
        speed,
        text,
        lineCount,
        lineHeight,
        typingSpeedMS,
        maskHeight = Settings.maskHeight,
        textStyle,
        style,
        onComplete,
        isComplete,
    }) => {
        const [displayedCount, setDisplayedCount] = useState(0);
        const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
        const onCompleteRef = useRef(onComplete);
        onCompleteRef.current = onComplete;

        useEffect(() => {
            setDisplayedCount(0);
        }, [text]);

        useEffect(() => {
            if (isComplete) {
                setDisplayedCount(text.length);
            }
        }, [isComplete, text.length]);

        useEffect(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (!play || isComplete) return;

            const intervalMS = Math.max(1, typingSpeedMS / Math.max(speed, 0.1));

            const id = setInterval(() => {
                setDisplayedCount(prev => {
                    const next = prev + 1;
                    if (next >= text.length) {
                        clearInterval(id);
                        intervalRef.current = null;
                        onCompleteRef.current?.();
                    }
                    return next;
                });
            }, intervalMS);
            intervalRef.current = id;

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }, [play, isComplete, text, typingSpeedMS, speed]);

        return (
            <div
                style={{
                    height: lineCount * lineHeight + maskHeight,
                    overflow: 'hidden',
                    ...(style as React.CSSProperties),
                }}
            >
                <span style={{ lineHeight: `${lineHeight}px`, ...(textStyle as React.CSSProperties) }}>
                    {text.slice(0, displayedCount)}
                </span>
            </div>
        );
    },
);
