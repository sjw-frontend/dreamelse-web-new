import { cloneDeep } from 'lodash';

import { DramatizeEnums, WorldLineEnums } from '$/enums';
import type {
    DramatizeTypes,
    FileTypes,
    StyleTypes,
    WorldLineTypes,
} from '$/types';
import { DataStoreUtils, EventUtils } from '$/utils';

import { DefaultDimensionsScale, DefaultFramesSpeed } from './consts';
import {
    getDefaultEffectStyle,
    getDefaultElementEffectStyle,
    setDefaultMotionFrom,
} from './default-layout';
import { createMotionActions } from './handle-actions';
import { getCanvasX, getCanvasY } from './parse-canvas-style';

let eleId = 0;

const getElementId = () => `${eleId++}`;

const createShowState = <T extends DramatizeTypes.VisualState>(
    info: LibTypes.VarOmit<T, 'show' | 'style'>,
) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
    const result = {
        ...info,
        get show() {
            return this.controlShow && !!this.style;
        },
    } as T;

    return result;
};

const createResourceId = (id: string, kind: WorldLineTypes.Api.ResourceKind) =>
    `${String(kind)}-${id}`;

export const createFramesElement = (
    options: LibTypes.Define<{
        resource: WorldLineTypes.Api.NarrativeFrames,
        resourceKind: WorldLineTypes.Api.FramesResourceKind,
        actions: DramatizeTypes.DirectorFramesElement['actions'],
        defaultSettings?: Partial<
            LibTypes.FrozenPick<
                WorldLineTypes.Api.NarrativeFrames,
                'loop' | 'speed'
            >
        >,
        parentId: DramatizeTypes.ElementId | null,
        isSingle: boolean,
    }>,
) => {
    const {
        resource,
        defaultSettings = {},
        resourceKind,
        actions,
        parentId,
        isSingle,
    } = options;
    const resourceId = createResourceId(resource.id, resourceKind);

    if (resource.files[0]) {
        const files = resource.files;
        const scale = resource.scale;

        const firstFile = resource.files[0];
        const meta = {
            width: firstFile.width,
            height: firstFile.height,
        };

        const dimensionsScale = scale ?? DefaultDimensionsScale;

        const scaleWidth = meta.width * dimensionsScale;
        const scaleHeight = meta.height * dimensionsScale;

        const events = EventUtils.define<DramatizeTypes.VisualEventMap>();

        const frames =
            DataStoreUtils.proxyReactiveData<DramatizeTypes.DirectorFramesElement>(
                {
                    parentId,
                    resourceId,
                    files,
                    meta,
                    isSingle,
                    dimensionsScale,
                    width: getCanvasX(scaleWidth),
                    height: getCanvasY(scaleHeight),

                    id: getElementId(),
                    kind: DramatizeEnums.UnitKind.Frames,

                    actions,

                    hotspots: undefined,

                    state: createShowState<
                        DramatizeTypes.DirectorFramesElement['state']
                    >({
                        isReady: false,
                        isActionsExecuted: false,

                        controlShow: false,
                        play: true,
                        loop: resource.loop ?? defaultSettings.loop ?? true,
                        speed:
                            resource.speed ??
                            defaultSettings.speed ??
                            DefaultFramesSpeed, // 1表示60fps, 0.2 表示12fps
                        currentAnimationStyle: undefined,
                    }),

                    extraZ: null,
                    ...events,
                },
            );

        return frames;
    }

    return null;
};

export const createFramesElementFromEffectInfo = (
    options: LibTypes.Define<{
        parentId: DramatizeTypes.ElementId | null,
        effectInfo: WorldLineTypes.Api.NarrativeEffect,
        scope: LibTypes.Nullable<DramatizeEnums.SpecialEffectScope>,
    }>,
) => {
    const { effectInfo, scope, parentId } = options;

    if (
        effectInfo.kind === WorldLineEnums.ApiEffectKind.Frames &&
        effectInfo.frames
    ) {
        const defaultStyle =
            scope === DramatizeEnums.SpecialEffectScope.Element
                ? getDefaultElementEffectStyle()
                : getDefaultEffectStyle();

        const target = setDefaultMotionFrom({
            target: cloneDeep({
                motion: effectInfo.motion,
            }),
            defaultStyle,
        });

        return createFramesElement({
            parentId,
            resource: effectInfo.frames,
            resourceKind: 'effect',
            actions: createMotionActions({
                baseDelayMS: null,
                motion: target.motion,
                repeat: false,
                dimensionsScale: null,
            }),
            isSingle: false,
        });
    }

    return null;
};

export const createImageElement = (
    options: LibTypes.Define<{
        resource: WorldLineTypes.Api.NarrativeImage,
        resourceKind: WorldLineTypes.Api.ImageResourceKind,
        actions: DramatizeTypes.DirectorImageElement['actions'],
        isSingle: boolean,
    }>,
) => {
    const { resource, resourceKind, actions, isSingle } = options;
    const resourceId = createResourceId(resource.id, resourceKind);

    const file = resource.file;
    const scale = resource.scale;

    const dimensionsScale = scale ?? DefaultDimensionsScale;

    const scaleWidth = file.width * dimensionsScale;
    const scaleHeight = file.height * dimensionsScale;

    const events = EventUtils.define<DramatizeTypes.VisualEventMap>();

    const image =
        DataStoreUtils.proxyReactiveData<DramatizeTypes.DirectorImageElement>({
            resourceId,
            file,
            isSingle,
            width: getCanvasX(scaleWidth),
            height: getCanvasY(scaleHeight),
            dimensionsScale,
            hotspots: createHotspots({
                rawFace: file.face ?? null,
                dimensionsScale,
                scaleWidth,
                scaleHeight,
            }),

            id: getElementId(),
            kind: DramatizeEnums.UnitKind.Image,

            state: createShowState<
                DramatizeTypes.DirectorImageElement['state']
            >({
                isReady: false,
                isActionsExecuted: false,

                controlShow: false,
                currentAnimationStyle: undefined,
            }),
            actions,

            parentId: null,

            extraZ: null,
            ...events,
        });

    return image;
};

export const createAudioElement = (
    options: LibTypes.Define<{
        cache: boolean,
        resource: WorldLineTypes.Api.NarrativeAudio,
        resourceKind: WorldLineTypes.Api.AudioResourceKind,
        defaultSettings?: Partial<
            LibTypes.FrozenPick<
                WorldLineTypes.Api.NarrativeAudio,
                'loop' | 'speed' | 'volume'
            >
        >,
    }>,
) => {
    const { cache, resource, defaultSettings = {}, resourceKind } = options;
    const resourceId = createResourceId(resource.id, resourceKind);

    const file = resource.file;

    const audio =
        DataStoreUtils.proxyReactiveData<DramatizeTypes.DirectorAudioElement>({
            resourceId,
            file,
            cache,

            id: getElementId(),
            kind: DramatizeEnums.UnitKind.Audio,

            state: {
                isReady: false,
                isEnd: false,
                isActionsExecuted: false,

                play: false,
                loop: resource.loop ?? defaultSettings.loop,
                speed: resource.speed ?? defaultSettings.speed,
                volume: resource.volume ?? defaultSettings.volume,
            },
        });

    return audio;
};

const createHotspots = (
    options: LibTypes.Define<{
        rawFace: FileTypes.ImageFaceInfo | null,
        dimensionsScale: number,
        scaleWidth: number,
        scaleHeight: number,
    }>,
) => {
    const { rawFace, dimensionsScale, scaleWidth, scaleHeight } = options;

    let face: FileTypes.ImageFaceInfo;
    if (rawFace) {
        face = {
            leftTop: {
                x: rawFace.leftTop.x * dimensionsScale,
                y: rawFace.leftTop.y * dimensionsScale,
            },
            rightBottom: {
                x: rawFace.rightBottom.x * dimensionsScale,
                y: rawFace.rightBottom.y * dimensionsScale,
            },
        };
    } else {
        // TODO 验证兜底
        face = {
            leftTop: {
                x: scaleWidth * 0.222,
                y: scaleHeight * 0.15,
            },
            rightBottom: {
                x: scaleWidth * 0.778,
                y: scaleHeight * 0.4625,
            },
        };
    }

    const hotspots = getRectMidpoints(
        toCoordinate(
            {
                x: face.leftTop.x,
                y: face.leftTop.y,
            },
            scaleWidth,
            scaleHeight,
        ),
        toCoordinate(
            {
                x: face.rightBottom.x,
                y: face.rightBottom.y,
            },
            scaleWidth,
            scaleHeight,
        ),
    );

    return hotspots;
};

const getRectMidpoints = (
    leftTop: StyleTypes.Coordinate,
    rightBottom: StyleTypes.Coordinate,
) => {
    // 提取坐标值，简化计算
    const { x: x1, y: y1 } = leftTop; // 左上角(x1,y1)
    const { x: x2, y: y2 } = rightBottom; // 右下角(x2,y2)

    // 计算各中点坐标
    const topMid: StyleTypes.Coordinate = {
        x: (x1 + x2) / 2, // 上边中点x = 左右x的平均值
        y: y1, // 上边中点y = 左上角y
    };

    const bottomMid: StyleTypes.Coordinate = {
        x: (x1 + x2) / 2, // 下边中点x = 左右x的平均值
        y: y2, // 下边中点y = 右下角y
    };

    const leftMid: StyleTypes.Coordinate = {
        x: x1, // 左边中点x = 左上角x
        y: (y1 + y2) / 2, // 左边中点y = 上下y的平均值
    };

    const rightMid: StyleTypes.Coordinate = {
        x: x2, // 右边中点x = 右下角x
        y: (y1 + y2) / 2, // 右边中点y = 上下y的平均值
    };

    const center: StyleTypes.Coordinate = {
        x: (x1 + x2) / 2, // 中心x = 左右x的平均值
        y: (y1 + y2) / 2, // 中心y = 上下y的平均值
    };

    return {
        [DramatizeEnums.OriginKind.Default]: { x: 0, y: 0 },
        [DramatizeEnums.OriginKind.FaceTop]: topMid,
        [DramatizeEnums.OriginKind.FaceBottom]: bottomMid,
        [DramatizeEnums.OriginKind.FaceLeft]: leftMid,
        [DramatizeEnums.OriginKind.FaceRight]: rightMid,
        [DramatizeEnums.OriginKind.FaceCenter]: center,
    } satisfies DramatizeTypes.Hotspots;
};

const toCoordinate = (
    originalCoord: StyleTypes.Coordinate,
    canvasWidth: number,
    canvasHeight: number,
): StyleTypes.Coordinate => {
    // 计算画布中心点在原坐标系中的位置
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // 坐标转换核心逻辑
    const newX = originalCoord.x - centerX;
    const newY = -(originalCoord.y - centerY); // Y轴方向取反

    return { x: newX * 2, y: newY * 2 };
};
