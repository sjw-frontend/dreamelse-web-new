/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    type RefObject,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react';

import { DramatizeEnums } from '$/enums';
import type {
    DramatizeTypes,
    FileTypes,
    ReactTypes,
    StyleTypes,
} from '$/types';
import { optimize } from '$/view';

import { FramesNormalSpeedInterval } from '../../@com';
import type { CanavsObjRef } from '../@types';

import { useRenderContext } from './@com/context';
import {
    Animated,
    Filter,
    Material,
    Position,
    SinusoidalShaking,
    TextureRef,
    Transform,
} from './@com/ecs/component';
import { ROOT_CONTAINER_ID } from './@com/ecs/misc';
import { TextureManager, TextureRetainPolicy } from './@com/manager';

export type FramesElementProps = LibTypes.FrozenDefine<{
    id: DramatizeTypes.ElementId,
    ref: RefObject<CanavsObjRef | null>,
    resourceId: DramatizeTypes.ResourceId,
    play: LibTypes.Nullable<boolean>,
    loop: LibTypes.Nullable<boolean>,
    files: LibTypes.Arr<FileTypes.ImageResource>,
    show: boolean,
    width: number,
    height: number,
    style: DramatizeTypes.DirectorVisualStyle | undefined,
    translate: LibTypes.Nullable<Partial<StyleTypes.Coordinate>>,
    animation: LibTypes.Nullable<DramatizeTypes.DirectorAnimation>,
    parentId: LibTypes.Nullable<DramatizeTypes.ElementId>,
    anchor: LibTypes.Nullable<Partial<StyleTypes.Coordinate>>,
    speed: LibTypes.Nullable<number>,
    specialEffects: LibTypes.Nullable<
        LibTypes.VarArr<DramatizeTypes.DirectorSpecialEffect>
    >,
    isSingle: LibTypes.Nullable<boolean>,
    dry: LibTypes.Nullable<boolean>,
    onAnimationEnd: LibTypes.Func<
        void,
        [
            id: DramatizeTypes.ElementId,
            currentAnimatedStyle: DramatizeTypes.DirectorAnimationStyle,
        ]
    >, // TODO
    onReady: LibTypes.Func<void, [id: DramatizeTypes.ElementId]>,
}>;

export const FramesElement: ReactTypes.FC<FramesElementProps> = optimize(
    ({
        id,
        resourceId,
        ref,
        style = {},
        width,
        height,
        animation,
        files,
        show,
        play,
        loop,
        parentId,
        specialEffects,
        speed,
        translate,
        anchor,
        isSingle,
        dry,
        onReady,
    }) => {
        const interval = useMemo(
            () => FramesNormalSpeedInterval / (speed ?? 1),
            [speed],
        );

        const { world } = useRenderContext();
        const handleReady = useCallback(() => onReady(id), [id, onReady]);

        const frameSeq = useMemo(() => world.registerFrameSeq(id), []);
        const specialEffectCleanups = useRef<
            LibTypes.VarArr<LibTypes.SimpleFunction>
        >([]);

        useImperativeHandle(
            ref,
            () => ({
                breakAnimations: () => {
                    world.removeAnimationComponents(id);

                    return {}; // TODO
                },
                removeSpecialEffects: () => {
                    specialEffectCleanups.current.forEach(cleanup => cleanup());
                    specialEffectCleanups.current = [];
                },
            }),
            [id],
        );

        useEffect(
            () => () => {
                world.cleanEntity(frameSeq.id);
            },
            [],
        );

        useEffect(() => {
            frameSeq.parent.id = parentId ?? ROOT_CONTAINER_ID;
        }, [parentId]);

        useEffect(() => {
            if (dry) {
                frameSeq.texture.image = TextureManager.emptyTexture;
                frameSeq.frames.images = [];
                world.textureManager.evict(resourceId);
                return;
            }

            let cancelled = false;
            let loaded = false;

            const loadTextures = async () => {
                try {
                    const textures =
                        await world.textureManager.loadTextureGroup(
                            resourceId,
                            files.map(f => f.uri),
                            isSingle
                                ? TextureRetainPolicy.Persist
                                : TextureRetainPolicy.OnDemand,
                        );
                    loaded = true;
                    if (cancelled) {
                        world.textureManager.release(resourceId);
                        return;
                    }

                    if (textures.length > 0) {
                        frameSeq.frames.images = textures;
                        frameSeq.frames.loop = loop ?? true;
                        frameSeq.texture.enable = true;

                        handleReady();
                    }
                } catch (error) {
                    if (!cancelled) {
                        console.error(
                            `frameseq ${id} failed to load frame textures:`,
                            error,
                        );
                    }
                }
            };

            loadTextures();

            return () => {
                cancelled = true;
                if (loaded) {
                    world.textureManager.release(resourceId);
                }
            };
        }, [resourceId, dry]);

        useEffect(() => {
            if (show) {
                frameSeq.misc.visible = true;
                frameSeq.frames.index = 0;
            } else frameSeq.misc.visible = false;
        }, [show]);

        useEffect(() => {
            frameSeq.frames.interval = interval;
        }, [interval]);

        useEffect(() => {
            frameSeq.frames.play = (play && show) ?? true;
            frameSeq.frames.loop = loop ?? true;
        }, [play, loop, show]);

        useEffect(() => {
            frameSeq.size.width = width!;
            frameSeq.size.height = height!;

            frameSeq.position.x = style.x!;
            frameSeq.position.y = style.y!;
            frameSeq.position.z = style.z!;

            frameSeq.transform.rotation = style.rotation!;
            frameSeq.transform.scale = style.scale!;
            frameSeq.transform.x = translate?.x ?? 0;
            frameSeq.transform.y = translate?.y ?? 0;

            frameSeq.material.opacity = style.opacity!;
            frameSeq.material.brightness = style.brightness!;
            frameSeq.material.color = style.color!;

            frameSeq.filter.blur = style.blur!;
        }, [style, translate, width, height]);

        useEffect(() => {
            if (anchor) {
                frameSeq.anchor.x = anchor.x!;
                frameSeq.anchor.y = anchor.y!;
            }
        }, [anchor]);

        // Handle animations
        useEffect(() => {
            if (!animation) return;
            const repeat =
                animation.repeat === 'default' ||
                animation.repeat === true ||
                animation.repeat === 'reverse';

            const loopback = animation.repeat === 'reverse';

            if (animation.style.x != null) {
                const anim = new Animated(
                    Position,
                    'x',
                    frameSeq.position.x,
                    animation.style.x,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.y != null) {
                const anim = new Animated(
                    Position,
                    'y',
                    frameSeq.position.y,
                    animation.style.y,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.z != null) {
                const anim = new Animated(
                    Position,
                    'z',
                    frameSeq.position.z,
                    animation.style.z,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.scale != null) {
                const scale = animation.style.scale;

                const anim = new Animated(
                    Transform,
                    'scale',
                    frameSeq.transform.scale,
                    scale,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.rotation != null) {
                const anim = new Animated(
                    Transform,
                    'rotation',
                    frameSeq.transform.rotation,
                    animation.style.rotation,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.opacity != null) {
                const anim = new Animated(
                    Material,
                    'opacity',
                    frameSeq.material.opacity,
                    animation.style.opacity,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.brightness != null) {
                const anim = new Animated(
                    Material,
                    'brightness',
                    frameSeq.material.brightness,
                    animation.style.brightness,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.color != null) {
                const anim = new Animated(
                    Material,
                    'color',
                    frameSeq.material.color,
                    animation.style.color,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.blur != null) {
                const anim = new Animated(
                    Filter,
                    'blur',
                    frameSeq.filter.blur,
                    animation.style.blur,
                    animation.durationMS ?? 1000,
                    repeat,
                    loopback,
                );
                world.registerComponent(id, anim);
            }
        }, [animation]);

        useEffect(() => {
            for (const specialEffect of specialEffects ?? []) {
                switch (specialEffect.kind) {
                    case DramatizeEnums.DirectorSpecialEffectKind.Vibrate: {
                        const effectFrameSeq = world.registerFrameSeq(
                            `${id}-vibrate`,
                        );

                        effectFrameSeq.parent.id = frameSeq.id;

                        effectFrameSeq.misc.visible = true;
                        effectFrameSeq.size.width = frameSeq.size.width;
                        effectFrameSeq.size.height = frameSeq.size.height;
                        effectFrameSeq.position.x = 0;
                        effectFrameSeq.position.y = 0;
                        effectFrameSeq.position.z = 1;

                        effectFrameSeq.texture.image = frameSeq.texture.image;
                        effectFrameSeq.material.opacity =
                            frameSeq.material.opacity;
                        effectFrameSeq.material.color = frameSeq.material.color;

                        effectFrameSeq.transform.scale =
                            frameSeq.transform.scale;

                        const repeat =
                            specialEffect.config.repeat === 'default' ||
                            specialEffect.config.repeat === true ||
                            specialEffect.config.repeat === 'reverse';
                        const loopback =
                            specialEffect.config.repeat === 'reverse';

                        world.registerComponent(
                            effectFrameSeq.id,
                            new TextureRef(frameSeq.id),
                        );

                        if (specialEffect.config.targetScale != null) {
                            world.registerComponent(
                                effectFrameSeq.id,
                                new Animated(
                                    Transform,
                                    'scale',
                                    1,
                                    specialEffect.config.targetScale,
                                    specialEffect.config.durationMS ?? 500,
                                    repeat,
                                    loopback,
                                ),
                            );
                        }

                        if (
                            specialEffect.config.startAlpha != null &&
                            specialEffect.config.targetAlpha != null
                        ) {
                            world.registerComponent(
                                effectFrameSeq.id,
                                new Animated(
                                    Material,
                                    'opacity',
                                    specialEffect.config.startAlpha,
                                    specialEffect.config.targetAlpha,
                                    specialEffect.config.durationMS ?? 500,
                                    repeat,
                                    loopback,
                                ),
                            );
                        }

                        // if (!repeat) {
                        //     setTimeout(() => {
                        //         effectFrameSeq.misc.visible = false;
                        //     }, specialEffect.durationMS ?? 500);
                        // }

                        specialEffectCleanups.current.push(() => {
                            world.cleanEntity(effectFrameSeq.id);
                        });

                        break;
                    }

                    case DramatizeEnums.DirectorSpecialEffectKind.Shake: {
                        world.registerComponent(
                            id,
                            new SinusoidalShaking(
                                specialEffect.config.amplitude ?? 1,
                                specialEffect.config.speed ?? 1,
                            ),
                        );

                        if (specialEffect.config.repeat === false) {
                            setTimeout(() => {
                                world.removeComponent(
                                    id,
                                    SinusoidalShaking.name,
                                );
                            }, specialEffect.config.durationMS ?? 500);
                        }

                        specialEffectCleanups.current.push(() => {
                            world.removeComponent(id, SinusoidalShaking.name);
                        });

                        break;
                    }

                    default: {
                        console.warn(
                            `Special effect ${JSON.stringify(specialEffect)} is not supported for FrameElement`,
                        );
                    }
                }
            }
        }, [specialEffects]);

        return <></>;
    },
);
