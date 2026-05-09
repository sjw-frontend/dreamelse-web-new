// @ts-nocheck
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

type Props = LibTypes.FrozenDefine<{
    colors?: string[],
}>;

const DEFAULT_COLORS = [
    'rgba(0, 0, 0, 0.00)',
    'rgba(0, 0, 0, 0.25)',
    'rgba(0, 0, 0, 0.40)',
];

export const GradientBackground: ReactTypes.FC<Props> = optimize(({ colors = DEFAULT_COLORS }) => {
    const gradient = `linear-gradient(to bottom, ${colors.join(', ')})`;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: gradient,
                pointerEvents: 'none',
                zIndex: 1,
            }}
        />
    );
});
