import { useEffect, useMemo, useRef, useState } from 'react';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { I18nTexts } from '../character-create-const';

type Props = LibTypes.FrozenDefine<{
    currentAbility: CharacterTypes.InitialAbility | null,
    evaluation: string | null,
    sumPercent: number,
}>;

export const AbilityFace: ReactTypes.FC<Props> = optimize(({ currentAbility, evaluation, sumPercent }) => {
    const previousEvaluation = useRef<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    const finalEvaluation = useMemo(() => {
        if (sumPercent === 0) return I18nTexts.noAbility;
        return sumPercent < 100
            ? I18nTexts.finishRate.replaceAll('{0}', Math.round(sumPercent).toString())
            : evaluation;
    }, [evaluation, sumPercent]);

    useEffect(() => {
        const hasValue = finalEvaluation !== null && finalEvaluation !== '';
        const hadValue = previousEvaluation.current !== null && previousEvaluation.current !== '';

        // 从无值变成有值时触发浮现动画（对齐 app Animated.parallel）
        if (hasValue && !hadValue) {
            setVisible(true);
            setAnimating(false);
            requestAnimationFrame(() => setAnimating(true));
        }

        previousEvaluation.current = finalEvaluation ?? null;
    }, [finalEvaluation]);

    const lottieUri = currentAbility?.lottie?.uri;

    return (
        <div
            style={{
                position: 'absolute',
                top: 320 - 100,
                left: 292 - 100,
                width: 200,
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
            }}
        >
            {visible && finalEvaluation && (
                <div
                    style={{
                        alignItems: 'center',
                        marginBottom: -30,
                        minWidth: 100,
                        maxWidth: 158,
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: animating ? 1 : 0,
                        transform: animating ? 'translateY(0)' : 'translateY(-10px)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#000',
                            borderRadius: 20,
                            padding: '12px',
                            maxWidth: 200,
                            minWidth: 100,
                        }}
                    >
                        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'center', display: 'block' }}>
                            {finalEvaluation}
                        </span>
                    </div>
                    {/* triangle */}
                    <div style={{
                        width: 0,
                        height: 0,
                        borderLeft: '18px solid transparent',
                        borderRight: '18px solid transparent',
                        borderTop: '12px solid #000',
                        marginTop: -1,
                    }} />
                </div>
            )}
            {lottieUri ? (
                <img src={lottieUri} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {/* 对齐 app ASSETS.Lottie.regularFace 兜底笑脸 */}
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="28" cy="32" r="5" fill="#fff" />
                        <circle cx="52" cy="32" r="5" fill="#fff" />
                        <path d="M26 50c4 6 24 6 28 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>
            )}
        </div>
    );
});
