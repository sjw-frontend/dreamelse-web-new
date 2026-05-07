// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';

type Props = LibTypes.FrozenDefine<{
    ability: CharacterTypes.InitialAbility,
    rankPosition: number,
    onValueChange: (id: string) => void,
    onLongPressStart?: () => void,
    onLongPressEnd?: () => void,
}>;

const MIN_WIDTH = 110;

export const AbilityBar: ReactTypes.FC<Props> = optimize(({
    ability,
    rankPosition,
    onValueChange,
    onLongPressStart,
    onLongPressEnd,
}) => {
    const { percent, name, id, colors } = ability;
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressing = useRef(false);

    const containerWidth = window.innerWidth - 32;
    const barWidth = percent === 0 ? MIN_WIDTH : (containerWidth - MIN_WIDTH) * percent / 100 + MIN_WIDTH;

    const startLongPress = useCallback(() => {
        isLongPressing.current = true;
        onLongPressStart?.();
        const increment = () => {
            if (isLongPressing.current && percent < 100) {
                onValueChange(id);
                longPressTimer.current = setTimeout(increment, 16);
            }
        };
        increment();
    }, [id, percent, onValueChange, onLongPressStart]);

    const stopLongPress = useCallback(() => {
        isLongPressing.current = false;
        onLongPressEnd?.();
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        if (longPressStartTimer.current) { clearTimeout(longPressStartTimer.current); longPressStartTimer.current = null; }
    }, [onLongPressEnd]);

    const handleMouseDown = useCallback(() => {
        longPressStartTimer.current = setTimeout(() => {
            startLongPress();
        }, 200);
    }, [startLongPress]);

    const handleMouseUp = useCallback(() => {
        if (longPressStartTimer.current) {
            clearTimeout(longPressStartTimer.current);
            longPressStartTimer.current = null;
            if (!isLongPressing.current && percent < 100) {
                onValueChange(id);
            }
        }
        stopLongPress();
    }, [id, percent, onValueChange, stopLongPress]);

    useEffect(() => () => stopLongPress(), []);

    const gradient = `linear-gradient(to right, ${colors.start ?? '#fff'}, ${colors.transition ?? '#fff'})`;

    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                top: rankPosition * 52,
                transition: 'top 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }}
        >
            <div
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                style={{
                    width: barWidth,
                    minWidth: MIN_WIDTH,
                    transition: 'width 0.1s ease',
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderRadius: 20,
                    background: percent === 0 ? 'rgba(255,255,255,1)' : gradient,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    userSelect: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                }}
            >
                <span style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: percent === 0 ? 'rgba(0,0,0,0.75)' : '#EDEDED',
                    flexShrink: 0,
                }}>
                    {name}
                </span>
                <span style={{
                    fontSize: 20,
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.4)',
                    flexShrink: 0,
                }}>
                    {Math.round(Math.min(percent, 100)) === 0 ? '+' : `${Math.round(Math.min(percent, 100))}%`}
                </span>
            </div>
        </div>
    );
});
