import { useMemo } from 'react';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';

type Props = LibTypes.FrozenDefine<{
    currentAbility: CharacterTypes.InitialAbility | null,
}>;

const DEFAULT_COLOR = '#1A1A1A';

const calculateCoverSizeAfterRotation = (screenWidth: number, screenHeight: number, angleDeg: number) => {
    const theta = angleDeg * Math.PI / 180;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const corners = [
        [screenWidth / 2, screenHeight / 2],
        [screenWidth / 2, -screenHeight / 2],
        [-screenWidth / 2, screenHeight / 2],
        [-screenWidth / 2, -screenHeight / 2],
    ] as const;

    let maxAbsU = 0;
    let maxAbsV = 0;

    for (const [x, y] of corners) {
        const u = x * cosT + y * sinT;
        const v = -x * sinT + y * cosT;
        maxAbsU = Math.max(maxAbsU, Math.abs(u));
        maxAbsV = Math.max(maxAbsV, Math.abs(v));
    }

    const scaleWidth = (2 * maxAbsU) / screenWidth;
    const scaleHeight = (2 * maxAbsV) / screenHeight;
    const scale = Math.max(scaleWidth, scaleHeight);

    return {
        width: scale * screenWidth,
        height: scale * screenHeight,
        scale,
    };
};

export const AbilityBackground: ReactTypes.FC<Props> = optimize(({ currentAbility }) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const { width: scaleWidth, height: scaleHeight } = useMemo(
        () => calculateCoverSizeAfterRotation(screenWidth, screenHeight, 30),
        [screenWidth, screenHeight],
    );

    const gradientColors = useMemo(() => {
        if (!currentAbility) {
            return { inner: DEFAULT_COLOR, middle: DEFAULT_COLOR, outer: DEFAULT_COLOR };
        }
        return {
            inner: currentAbility.colors.start ?? DEFAULT_COLOR,
            middle: currentAbility.colors.transition ?? DEFAULT_COLOR,
            outer: currentAbility.colors.end ?? DEFAULT_COLOR,
        };
    }, [currentAbility]);

    const rx = screenWidth * 1.7989;
    const ry = screenHeight * 0.4558;
    const cx = (scaleWidth - screenWidth) / 2 + 292;
    const cy = (scaleHeight - screenHeight) / 2 + 320;

    const translateX = (screenWidth - scaleWidth) / 2 - 146;
    const translateY = (screenHeight - scaleHeight) / 2 + 160;

    return (
        <div
            style={{
                position: 'absolute',
                width: scaleWidth,
                height: scaleHeight,
                transform: `rotate(30deg) translateX(${translateX}px) translateY(${translateY}px)`,
                transformOrigin: `${cx}px ${cy}px`,
                pointerEvents: 'none',
            }}
        >
            <svg width={scaleWidth} height={scaleHeight}>
                <defs>
                    <radialGradient
                        id="abilityGradient"
                        cx={cx}
                        cy={cy}
                        r={Math.max(rx, ry)}
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%" stopColor={gradientColors.inner} />
                        <stop offset="38%" stopColor={gradientColors.middle} />
                        <stop offset="100%" stopColor={gradientColors.outer} />
                    </radialGradient>
                </defs>
                <rect width={scaleWidth} height={scaleHeight} fill="url(#abilityGradient)" />
            </svg>
        </div>
    );
});
