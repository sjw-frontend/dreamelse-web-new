import { DramatizeEnums, WorldLineEnums } from '$/enums';
import type { DramatizeTypes, WorldLineTypes } from '$/types';
import { MathUtils } from '$/utils';

import { BlurEffectCodeRatio } from './consts';
import { getCanvasStyleFromMotion } from './parse-canvas-style';

const getOriginKindFromMotion = (
    motion: LibTypes.RequiredKeepUndefined<
        LibTypes.FrozenPick<
            WorldLineTypes.Api.ElementMotion,
            'origin' | 'visual_center'
        >
    >,
) => {
    if (motion.visual_center === 'face') {
        if (motion.origin === 'top') {
            return DramatizeEnums.OriginKind.FaceTop;
        }
        if (motion.origin === 'right') {
            return DramatizeEnums.OriginKind.FaceRight;
        }
        if (motion.origin === 'bottom') {
            return DramatizeEnums.OriginKind.FaceBottom;
        }
        if (motion.origin === 'left') {
            return DramatizeEnums.OriginKind.FaceLeft;
        }
        if (motion.origin === 'center') {
            return DramatizeEnums.OriginKind.FaceCenter;
        }
    }

    return DramatizeEnums.OriginKind.Default;
};

const getSelfOriginKindFromMotion = (
    motion: LibTypes.RequiredKeepUndefined<
        LibTypes.FrozenPick<
            WorldLineTypes.Api.ElementMotion,
            'self_origin' | 'self_visual_center'
        >
    >,
) => {
    if (motion.self_visual_center === 'face') {
        if (motion.self_origin === 'top') {
            return DramatizeEnums.OriginKind.FaceTop;
        }
        if (motion.self_origin === 'right') {
            return DramatizeEnums.OriginKind.FaceRight;
        }
        if (motion.self_origin === 'bottom') {
            return DramatizeEnums.OriginKind.FaceBottom;
        }
        if (motion.self_origin === 'left') {
            return DramatizeEnums.OriginKind.FaceLeft;
        }
        if (motion.self_origin === 'center') {
            return DramatizeEnums.OriginKind.FaceCenter;
        }
    }

    return DramatizeEnums.OriginKind.Default;
};

const getSetStyleActionValues = <T extends WorldLineTypes.Api.Motion>(
    options: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        motion: T,
        dimensionsScale: LibTypes.Nullable<number>,
    }>,
) => {
    const { baseDelayMS, motion, dimensionsScale } = options;
    return (
        motion.from && {
            delayMS: (baseDelayMS ?? 0) + (motion.start ?? 0),
            style: getCanvasStyleFromMotion<T['from'] & {}>(
                motion.from,
                dimensionsScale,
            ),
        }
    );
};

const getAnimatedActionValues = <T extends WorldLineTypes.Api.Motion>(
    options: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        motion: T,
        repeat: LibTypes.Nullable<DramatizeTypes.UnitAnimatedRepeat>,
        dimensionsScale: LibTypes.Nullable<number>,
    }>,
) => {
    const { baseDelayMS, motion, repeat, dimensionsScale } = options;
    return (
        motion.to && {
            delayMS: (baseDelayMS ?? 0) + (motion.start ?? 0),
            params: {
                style: getCanvasStyleFromMotion<T['to'] & {}>(
                    motion.to,
                    dimensionsScale,
                ),
                durationMS: (motion.end ?? 0) - (motion.start ?? 0),
                repeat: motion.loop ?? repeat,
            },
        }
    );
};

export const createSetStyleFromElementActions = (
    options: LibTypes.VarDefine<{
        delayMS: LibTypes.Nullable<number>,
        element: DramatizeTypes.DirectorVisualElement,
    }>,
) => {
    const { delayMS, element } = options;

    const actions: LibTypes.VarArr<DramatizeTypes.DirectorVisualActionUnion> =
        [];

    actions.push({
        delayMS,
        kind: DramatizeEnums.ActionKind.SetStyleFromElement,
        params: {
            element,
        },
    });

    return actions;
};

export const createMotionActions = (
    options: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        motion: WorldLineTypes.Api.ElementMotion,
        repeat: LibTypes.Nullable<DramatizeTypes.UnitAnimatedRepeat>,
        dimensionsScale: LibTypes.Nullable<number>,
    }>,
) => {
    const { baseDelayMS, motion, repeat, dimensionsScale } = options;

    const originKind = getOriginKindFromMotion({
        visual_center: motion.visual_center,
        origin: motion.origin,
    });
    const selfOriginKind = getSelfOriginKindFromMotion({
        self_visual_center: motion.self_visual_center,
        self_origin: motion.self_origin,
    });

    const actions: LibTypes.VarArr<DramatizeTypes.DirectorVisualActionUnion> =
        [];

    const setStyleActionValues = getSetStyleActionValues({
        baseDelayMS,
        motion,
        dimensionsScale,
    });

    setStyleActionValues &&
        actions.push({
            kind: DramatizeEnums.ActionKind.SetStyle,
            delayMS: setStyleActionValues.delayMS,
            params: {
                style: setStyleActionValues.style,
                originKind,
                selfOriginKind,
            },
        });

    const animatedActionValues = getAnimatedActionValues({
        baseDelayMS,
        motion,
        repeat,
        dimensionsScale,
    });
    animatedActionValues &&
        actions.push({
            ...animatedActionValues,
            kind: DramatizeEnums.ActionKind.Animation,
        });

    return actions;
};

export const createSceneMotionActions = (
    options: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        motion: WorldLineTypes.Api.SceneMotion,
        repeat: LibTypes.Nullable<DramatizeTypes.UnitAnimatedRepeat>,
    }>,
) => {
    const { baseDelayMS, motion, repeat } = options;

    const actions: LibTypes.VarArr<DramatizeTypes.DirectorSceneActionUnion> =
        [];

    const setStyleActionValues = getSetStyleActionValues({
        baseDelayMS,
        motion,
        dimensionsScale: null,
    });

    setStyleActionValues &&
        actions.push({
            kind: DramatizeEnums.ActionKind.SceneSetStyle,
            delayMS: setStyleActionValues.delayMS,
            params: {
                style: setStyleActionValues.style,
            },
        });

    const animatedActionValues = getAnimatedActionValues({
        baseDelayMS,
        motion,
        repeat,
        dimensionsScale: null,
    });
    animatedActionValues &&
        actions.push({
            ...animatedActionValues,
            kind: DramatizeEnums.ActionKind.SceneAnimation,
        });

    return actions;
};

const checkScaleEffectCode = (
    effectCodeKind: WorldLineEnums.ApiEffectCodeKind | undefined,
) =>
    effectCodeKind === WorldLineEnums.ApiEffectCodeKind.character_dim ||
    effectCodeKind === WorldLineEnums.ApiEffectCodeKind.character_breath;

const getDurationMSFromEffectCodeProps = (
    effectCodeProps: WorldLineTypes.Api.EffectCodeProps | null,
) => MathUtils.s2ms(effectCodeProps?.duration);

const getScaleEffectCodeParams = (
    options: LibTypes.FrozenDefine<{
        effectCodeKind: WorldLineEnums.ApiEffectCodeKind | undefined,
        effectCodeProps: WorldLineTypes.Api.EffectCodeProps | null,
    }>,
) => {
    const { effectCodeKind, effectCodeProps } = options;

    return {
        style: {
            relativeScale: effectCodeProps?.end_scale,
            brightness: effectCodeProps?.end_brightness,
        },
        durationMS: getDurationMSFromEffectCodeProps(effectCodeProps),
        repeat:
            effectCodeKind === WorldLineEnums.ApiEffectCodeKind.character_breath
                ? 'reverse'
                : false,
    } as const;
};

const getBlurEffectCodeParams = (
    options: LibTypes.FrozenDefine<{
        effectCodeProps: WorldLineTypes.Api.EffectCodeProps | null,
    }>,
) => {
    const { effectCodeProps } = options;

    return {
        style: {
            blur: (effectCodeProps?.blur_strength ?? 0) * BlurEffectCodeRatio,
        },
    } as const;
};

export const createEffectsActions = (
    options: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        dimensionsScale: LibTypes.Nullable<number>,
        effects: LibTypes.Arr<WorldLineTypes.Api.Effect>,
        resourceRecord: WorldLineTypes.Api.ResourceRecord,
        repeat: LibTypes.Nullable<DramatizeTypes.UnitAnimatedRepeat>,
    }>,
) => {
    const { baseDelayMS, dimensionsScale, effects, resourceRecord, repeat } =
        options;

    const actions: LibTypes.VarArr<DramatizeTypes.DirectorVisualActionUnion> =
        [];
    effects.forEach(effect => {
        if (effect.effect_id != null) {
            const effectInfo = resourceRecord.effect[effect.effect_id];
            const effectCodeProps = effectInfo?.effectCode?.props ?? null;
            if (effectInfo) {
                if (effectInfo.kind === WorldLineEnums.ApiEffectKind.Code) {
                    if (checkScaleEffectCode(effectInfo.effectCode?.kind)) {
                        actions.push({
                            kind: DramatizeEnums.ActionKind.Animation,
                            delayMS: baseDelayMS,
                            params: getScaleEffectCodeParams({
                                effectCodeKind: effectInfo.effectCode.kind,
                                effectCodeProps,
                            }),
                        });
                    } else if (
                        effectInfo.effectCode?.kind ===
                        WorldLineEnums.ApiEffectCodeKind.character_blur
                    ) {
                        actions.push({
                            kind: DramatizeEnums.ActionKind.SetStyle,
                            delayMS: baseDelayMS,
                            params: getBlurEffectCodeParams({
                                effectCodeProps,
                            }),
                        });
                    } else if (
                        effectInfo.effectCode?.kind ===
                        WorldLineEnums.ApiEffectCodeKind.shaking_cellphone
                    ) {
                        actions.push({
                            kind: DramatizeEnums.ActionKind.AddSpecialEffect,
                            delayMS: baseDelayMS,
                            params: {
                                kind: DramatizeEnums.DirectorSpecialEffectKind
                                    .Vibrate,
                                config: {
                                    durationMS:
                                        getDurationMSFromEffectCodeProps(
                                            effectCodeProps,
                                        ),
                                    startAlpha: effectCodeProps?.start_alpha,
                                    targetAlpha: effectCodeProps?.target_alpha,
                                    targetScale: effectCodeProps?.target_scale,
                                },
                            },
                        });
                    }
                } else if (
                    effectInfo.kind === WorldLineEnums.ApiEffectKind.Motion &&
                    effectInfo.motion
                ) {
                    actions.push(
                        ...createMotionActions({
                            baseDelayMS,
                            motion: effectInfo.motion,
                            repeat: effect.loop ?? repeat,
                            dimensionsScale,
                        }),
                    );
                }
            }
        }
    });

    return actions;
};

export const createSceneEffectsActions = (
    params: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        effects: LibTypes.Arr<WorldLineTypes.Api.Effect>,
        resourceRecord: WorldLineTypes.Api.ResourceRecord,
        repeat: LibTypes.Nullable<DramatizeTypes.UnitAnimatedRepeat>,
    }>,
) => {
    const { baseDelayMS, effects, resourceRecord, repeat } = params;

    const actions: LibTypes.VarArr<DramatizeTypes.DirectorSceneActionUnion> =
        [];
    effects.forEach(effect => {
        if (effect.effect_id != null) {
            const effectInfo = resourceRecord.effect[effect.effect_id];
            const effectCodeProps = effectInfo?.effectCode?.props ?? null;

            if (effectInfo) {
                if (effectInfo.kind === WorldLineEnums.ApiEffectKind.Code) {
                    if (checkScaleEffectCode(effectInfo.effectCode?.kind)) {
                        actions.push({
                            kind: DramatizeEnums.ActionKind.SceneAnimation,
                            delayMS: baseDelayMS,
                            params: getScaleEffectCodeParams({
                                effectCodeKind: effectInfo.effectCode.kind,
                                effectCodeProps,
                            }),
                        });
                    } else if (
                        effectInfo.effectCode?.kind ===
                        WorldLineEnums.ApiEffectCodeKind.character_blur
                    ) {
                        actions.push({
                            kind: DramatizeEnums.ActionKind.SceneSetStyle,
                            delayMS: baseDelayMS,
                            params: getBlurEffectCodeParams({
                                effectCodeProps,
                            }),
                        });
                    } else if (
                        effectInfo.effectCode?.kind ===
                        WorldLineEnums.ApiEffectCodeKind.shaking
                    ) {
                        actions.push({
                            kind: DramatizeEnums.ActionKind.SceneSpecialEffect,
                            delayMS: baseDelayMS,
                            params: {
                                kind: DramatizeEnums
                                    .DirectorSceneSpecialEffectKind.Shake,
                                config: {
                                    durationMS:
                                        getDurationMSFromEffectCodeProps(
                                            effectCodeProps,
                                        ),
                                    amplitude: effectCodeProps?.shake_amplitude,
                                    speed: effectCodeProps?.shake_speed,
                                },
                            },
                        });
                    } else if (
                        effectInfo.effectCode?.kind ===
                        WorldLineEnums.ApiEffectCodeKind.dark_noise
                    ) {
                        actions.push({
                            kind: DramatizeEnums.ActionKind.SceneSpecialEffect,
                            delayMS: baseDelayMS,
                            params: {
                                kind: DramatizeEnums
                                    .DirectorSceneSpecialEffectKind.FilmFilter,
                                config: {
                                    durationMS:
                                        getDurationMSFromEffectCodeProps(
                                            effectCodeProps,
                                        ),
                                    playSpeed: effectCodeProps?.speed,
                                    blackLineWidth:
                                        effectCodeProps?.black_line_width,
                                    dotSize: effectCodeProps?.dot_size,
                                },
                            },
                        });
                    } else if (effectInfo.effectCode?.kind != null) {
                        if (
                            effectInfo.effectCode.kind in
                            DramatizeEnums.DirectorSceneSpecialEffectKind
                        ) {
                            actions.push({
                                kind: DramatizeEnums.ActionKind
                                    .SceneSpecialEffect,
                                delayMS: baseDelayMS,
                                params: {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                                    kind: effectInfo.effectCode.kind as any,
                                    config: {},
                                },
                            });
                        }
                    }
                } else if (
                    effectInfo.kind === WorldLineEnums.ApiEffectKind.Motion &&
                    effectInfo.motion
                ) {
                    actions.push(
                        ...createSceneMotionActions({
                            baseDelayMS,
                            motion: effectInfo.motion,
                            repeat: effect.loop ?? repeat,
                        }),
                    );
                }
            }
        }
    });

    return actions;
};
