import type { DramatizeTypes, WorldLineTypes } from '$/types';
import { ObjectUtils } from '$/utils';

type DirectorVisualStyle = Required<DramatizeTypes.DirectorVisualStyle>;

export const getDefaultRoleStyle = () =>
    ({
        x: 0,
        y: 0,
        z: 100,

        scale: 1,
        rotation: 0,
        opacity: 1,
        brightness: 1,
        blur: 0,
        color: null,
    }) as const satisfies DirectorVisualStyle;

export const getDefaultBackgroundStyle = () =>
    ({
        ...getDefaultRoleStyle(),
        z: 0,
    }) as const satisfies DirectorVisualStyle;

export const getDefaultElementEffectStyle = () =>
    ({
        ...getDefaultRoleStyle(),
        z: 1,
    }) as const satisfies DirectorVisualStyle;

export const getDefaultEffectStyle = () =>
    ({
        ...getDefaultRoleStyle(),
        z: 500,
    }) as const satisfies DirectorVisualStyle;

export const getDefaultSceneStyle = () =>
    ({
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        blur: 0,
        brightness: 1,
        color: null,
        opacity: 1,
        sharpness: 0.2,
        overlayColor: null,
        overlayOpacity: 0,
    }) as const satisfies Required<DramatizeTypes.DirectorSceneStyle>;

export const getDefaultOneRoleShots = () =>
    [
        {
            slot: 0,
            pose: '正面',
            motion: {
                from: {
                    x: 0,
                    y: -900,
                    scale: 1.33,
                },
            },
        },
    ] as const satisfies LibTypes.Arr<WorldLineTypes.Api.Actor>;

export const getDefaultTowRoleShots = () =>
    [
        {
            slot: 0,
            pose: '正面1',
            motion: {
                from: {
                    x: -600,
                    y: -900,
                    scale: 1.33,
                },
            },
        },
        {
            slot: 1,
            pose: '正面2',
            motion: {
                from: {
                    x: 600,
                    y: -900,
                    scale: 1.33,
                },
            },
        },
    ] as const satisfies LibTypes.Arr<WorldLineTypes.Api.Actor>;

export const getDefaultThreeRoleShots = () =>
    [
        {
            slot: 0,
            pose: '正面1',
            motion: {
                from: {
                    x: -850,
                    y: -500,
                },
            },
        },
        {
            slot: 1,
            pose: '正面2',
            motion: {
                from: {
                    x: 0,
                    y: -500,
                },
            },
        },
        {
            slot: 2,
            pose: '正面3',
            motion: {
                from: {
                    x: 850,
                    y: -500,
                },
            },
        },
    ] as const satisfies LibTypes.Arr<WorldLineTypes.Api.Actor>;

export const getDefaultRoleMotion = () =>
    ({
        end: 5000,
        to: { relativeScale: 1.02 },
        loop: 'reverse',
    }) as const satisfies WorldLineTypes.Api.ElementMotion;

type SetDefaultFromIfNeedOptions =
    | LibTypes.Define<{
          target: LibTypes.VarDefine<{
              motion?: WorldLineTypes.Api.ElementMotion | null,
          }>,
          defaultStyle: DramatizeTypes.DirectorVisualStyle,
      }>
    | LibTypes.Define<{
          target: LibTypes.VarDefine<{
              motion?: WorldLineTypes.Api.SceneMotion | null,
          }>,
          defaultStyle: DramatizeTypes.DirectorSceneStyle,
      }>;

export const setDefaultMotionFrom = <T extends SetDefaultFromIfNeedOptions>(
    options: T,
) => {
    const { target, defaultStyle } = options;

    target.motion ??= {};

    if (!target.motion.from) {
        target.motion.from = defaultStyle;
    } else {
        target.motion.from = ObjectUtils.mergeExcludeUndefined(
            defaultStyle,
            target.motion.from,
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return target as LibTypes.SetNonNullable<
        LibTypes.SetRequired<T['target'], 'motion'>,
        'motion'
    >;
};
