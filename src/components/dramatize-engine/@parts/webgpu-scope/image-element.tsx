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

import type { CanavsObjRef } from '../@types';

import { useRenderContext } from './@com/context';
import {
    Animated,
    Filter,
    Material,
    Position,
    SinusoidalShaking,
    Transform,
} from './@com/ecs/component';
import { ROOT_CONTAINER_ID } from './@com/ecs/misc';
import { TextureManager, TextureRetainPolicy } from './@com/manager';

export type ImageElementProps = LibTypes.FrozenDefine<{
    id: DramatizeTypes.ElementId,
    ref: RefObject<CanavsObjRef | null>,
    file: FileTypes.ImageResource,
    show: boolean,
    width: number,
    height: number,
    style: DramatizeTypes.DirectorVisualStyle | undefined,
    translate: LibTypes.Nullable<Partial<StyleTypes.Coordinate>>,
    animation: LibTypes.Nullable<DramatizeTypes.DirectorAnimation>,
    parentId: LibTypes.Nullable<DramatizeTypes.ElementId>,
    anchor: LibTypes.Nullable<Partial<StyleTypes.Coordinate>>,
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

export const ImageElement: ReactTypes.FC<ImageElementProps> = optimize(
    ({
        id,
        ref,
        file,
        width,
        height,
        style = {},
        animation,
        show,
        parentId,
        specialEffects,
        anchor,
        translate,
        isSingle,
        dry,
        onReady,
    }) => {
        const { world } = useRenderContext();
        const handleReady = useCallback(() => onReady(id), [id, onReady]);

        const sprite = useMemo(() => world.registerSprite(id), []);
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
                world.cleanEntity(sprite.id);
            },
            [],
        );

        useEffect(() => {
            sprite.parent.id = parentId ?? ROOT_CONTAINER_ID;
        }, [parentId]);

        useEffect(() => {
            if (dry) {
                sprite.texture.image = TextureManager.emptyTexture;
                world.textureManager.evict(file.id);
                handleReady();
                return;
            }

            let cancelled = false;
            let loaded = false;

            const loadTexture = async () => {
                try {
                    const texture = await world.textureManager.loadTexture(
                        file.id,
                        file.uri,
                        isSingle
                            ? TextureRetainPolicy.Persist
                            : TextureRetainPolicy.OnDemand,
                    );
                    loaded = true;
                    if (cancelled) {
                        world.textureManager.release(file.id);
                        return;
                    }
                    sprite.texture.image = texture;
                    sprite.texture.enable = true;
                    handleReady();
                } catch (error) {
                    if (!cancelled) {
                        console.error(
                            `${id} failed to load texture:`,
                            error,
                            id,
                            file,
                        );
                    }
                }
            };
            loadTexture();

            return () => {
                cancelled = true;
                if (loaded) {
                    world.textureManager.release(file.id);
                }
            };
        }, [file.id, dry]);

        useEffect(() => {
            if (show) sprite.misc.visible = true;
            else sprite.misc.visible = false;
        }, [show]);

        useEffect(() => {
            sprite.size.width = width!;
            sprite.size.height = height!;

            sprite.position.x = style.x!;
            sprite.position.y = style.y!;
            sprite.position.z = style.z!;

            sprite.transform.rotation = style.rotation!;
            sprite.transform.scale = style.scale!;
            sprite.transform.x = translate?.x ?? 0;
            sprite.transform.y = translate?.y ?? 0;

            sprite.material.opacity = style.opacity!;
            sprite.material.brightness = style.brightness!;
            sprite.material.color = style.color!;

            sprite.filter.blur = style.blur!;
        }, [width, height, style, translate]);

        useEffect(() => {
            if (anchor) {
                sprite.anchor.x = anchor.x!;
                sprite.anchor.y = anchor.y!;
            }
        }, [anchor]);

        // Handle animations
        useEffect(() => {
            if (!animation) return;
            const loop =
                animation.repeat === 'default' ||
                animation.repeat === true ||
                animation.repeat === 'reverse';

            const loopback = animation.repeat === 'reverse';

            if (animation.style.x != null) {
                const anim = new Animated(
                    Position,
                    'x',
                    sprite.position.x,
                    animation.style.x,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.y != null) {
                const anim = new Animated(
                    Position,
                    'y',
                    sprite.position.y,
                    animation.style.y,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.z != null) {
                const anim = new Animated(
                    Position,
                    'z',
                    sprite.position.z,
                    animation.style.z,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.scale != null) {
                const scale = animation.style.scale;

                const anim = new Animated(
                    Transform,
                    'scale',
                    sprite.transform.scale,
                    scale,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.rotation != null) {
                const anim = new Animated(
                    Transform,
                    'rotation',
                    sprite.transform.rotation,
                    animation.style.rotation,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.opacity != null) {
                const anim = new Animated(
                    Material,
                    'opacity',
                    sprite.material.opacity,
                    animation.style.opacity,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.brightness != null) {
                const anim = new Animated(
                    Material,
                    'brightness',
                    sprite.material.brightness,
                    animation.style.brightness,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.color != null) {
                const anim = new Animated(
                    Material,
                    'color',
                    sprite.material.color,
                    animation.style.color,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }

            if (animation.style.blur != null) {
                const anim = new Animated(
                    Filter,
                    'blur',
                    sprite.filter.blur,
                    animation.style.blur,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(id, anim);
            }
        }, [animation]);

        useEffect(() => {
            for (const specialEffect of specialEffects ?? []) {
                switch (specialEffect.kind) {
                    case DramatizeEnums.DirectorSpecialEffectKind.Vibrate: {
                        const effectSprite = world.registerSprite(
                            `${id}-vibrate`,
                        );

                        effectSprite.parent.id = sprite.id;

                        effectSprite.misc.visible = true;
                        effectSprite.size.width = sprite.size.width;
                        effectSprite.size.height = sprite.size.height;
                        effectSprite.position.x = 0;
                        effectSprite.position.y = 0;
                        effectSprite.position.z = 1;

                        effectSprite.texture.image = sprite.texture.image;
                        effectSprite.material.opacity = sprite.material.opacity;
                        effectSprite.material.color = sprite.material.color;

                        effectSprite.transform.scale = sprite.transform.scale;

                        const loop =
                            specialEffect.config.repeat === 'default' ||
                            specialEffect.config.repeat === true ||
                            specialEffect.config.repeat === 'reverse';
                        const loopback =
                            specialEffect.config.repeat === 'reverse';

                        if (specialEffect.config.targetScale != null) {
                            world.registerComponent(
                                effectSprite.id,
                                new Animated(
                                    Transform,
                                    'scale',
                                    1,
                                    specialEffect.config.targetScale,
                                    specialEffect.config.durationMS ?? 500,
                                    loop,
                                    loopback,
                                ),
                            );
                        }

                        if (
                            specialEffect.config.startAlpha != null &&
                            specialEffect.config.targetAlpha != null
                        ) {
                            world.registerComponent(
                                effectSprite.id,
                                new Animated(
                                    Material,
                                    'opacity',
                                    specialEffect.config.startAlpha,
                                    specialEffect.config.targetAlpha,
                                    specialEffect.config.durationMS ?? 500,
                                    loop,
                                    loopback,
                                ),
                            );
                        }

                        // if (!loop) {
                        //     setTimeout(() => {
                        //         effectSprite.misc.visible = false;
                        //     }, specialEffect.durationMS ?? 500);
                        // }
                        specialEffectCleanups.current.push(() => {
                            world.cleanEntity(effectSprite.id);
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
                            `Special effect ${JSON.stringify(specialEffect)} is not supported for ImageElement`,
                        );
                    }
                }
            }
        }, [specialEffects]);

        return <></>;
    },
);
