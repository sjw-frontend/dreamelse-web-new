/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    type RefObject,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react';

import { DramatizeEnums } from '$/enums';
import type { DramatizeTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';

import type { CanavsObjRef } from '../@types';

import { useRenderContext } from './@com';
import {
    Animated,
    Material,
    Position,
    PostProcessing,
    SinusoidalShaking,
    Transform,
} from './@com/ecs/component';
import { ROOT_CONTAINER_ID, ROOT_OVERLAY_ID } from './@com/ecs/misc';

export type SceneContainerProps = LibTypes.FrozenDefine<{
    ref: RefObject<CanavsObjRef | null>,
    style: DramatizeTypes.DirectorSceneStyle | undefined,
    animation: LibTypes.Nullable<DramatizeTypes.DirectorSceneAnimation>,
    surroundingShadow: LibTypes.Nullable<
        LibTypes.VarDefine<{
            show: boolean,
            z: number,
        }>
    >,
    specialEffects: LibTypes.Nullable<
        LibTypes.VarArr<DramatizeTypes.DirectorSceneSpecialEffect>
    >,
    suspend: LibTypes.Nullable<boolean>,
    speed: LibTypes.Nullable<number>,
}>;

export const SceneContainer: ReactTypes.FC<SceneContainerProps> = optimize(
    ({
        ref,
        style = {},
        animation,
        surroundingShadow,
        specialEffects,
        suspend,
        speed,
    }) => {
        const { world } = useRenderContext();
        const specialEffectCleanups = useRef<
            LibTypes.VarArr<LibTypes.SimpleFunction>
        >([]);
        const container = useMemo(
            () => world.registerContainer(ROOT_CONTAINER_ID),
            [],
        );

        useImperativeHandle(
            ref,
            () => ({
                breakAnimations: () => {
                    world.removeAnimationComponents(container.id);
                    world.removeAnimationComponents(overlay.id);
                    world.removeSceneAnimatedComponents();

                    return {}; // TODO
                },
                removeSpecialEffects: () => {
                    specialEffectCleanups.current.forEach(cleanup => cleanup());
                    specialEffectCleanups.current = [];
                    world.disableAllEffectMeshes();
                },
            }),
            [],
        );

        const overlay = useMemo(() => {
            const sprite = world.registerSprite(ROOT_OVERLAY_ID);
            sprite.misc.visible = true;
            sprite.position.z = 10000;
            sprite.size.width = 10000;
            sprite.size.height = 10000;
            // sprite.material.color = '#ff0000';
            sprite.material.opacity = 0;
            sprite.texture.enable = false;
            return sprite;
        }, []);

        useEffect(() => {
            container.misc.visible = true;
            overlay.misc.visible = true;
            return () => {
                world.cleanEntity(container.id);
                world.cleanEntity(overlay.id);
            };
        }, []);

        useEffect(() => {
            world.suspend = suspend ?? false;
        }, [suspend]);

        useEffect(() => {
            world.speed = speed ?? 1;
        }, [speed]);

        useEffect(() => {
            container.position.x = style.x!;
            container.position.y = style.y!;

            container.transform.rotation = style.rotation!;
            container.transform.scale = style.scale!;

            overlay.material.color = style.overlayColor!;
            overlay.material.opacity = style.overlayOpacity!;

            world.postProcessing.blur =
                style.blur !== undefined ? style.blur / 100 : 0;
            world.postProcessing.brightness = style.brightness!;
            world.postProcessing.sharpness = style.sharpness!;
            world.postProcessing.color = style.color!;
            world.postProcessing.opacity = style.opacity!;
        }, [style]);

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
                    container.position.x,
                    animation.style.x,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animation.style.y != null) {
                const anim = new Animated(
                    Position,
                    'y',
                    container.position.y,
                    animation.style.y,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animation.style.scale != null) {
                const anim = new Animated(
                    Transform,
                    'scale',
                    container.transform.scale,
                    animation.style.scale,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animation.style.rotation != null) {
                const anim = new Animated(
                    Transform,
                    'rotation',
                    container.transform.rotation,
                    animation.style.rotation,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animation.style.overlayOpacity != null) {
                const anim = new Animated(
                    Material,
                    'opacity',
                    overlay.material.opacity,
                    animation.style.overlayOpacity,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(overlay.id, anim);
            }

            if (animation.style.color != null) {
                const anim = new Animated(
                    PostProcessing,
                    'color',
                    world.postProcessing.color,
                    animation.style.color,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerSceneComponent(anim);
            }

            if (animation.style.opacity != null) {
                const anim = new Animated(
                    PostProcessing,
                    'opacity',
                    world.postProcessing.opacity,
                    animation.style.opacity,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerSceneComponent(anim);
            }

            if (animation.style.blur != null) {
                const anim = new Animated(
                    PostProcessing,
                    'blur',
                    world.postProcessing.blur,
                    animation.style.blur / 100,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerSceneComponent(anim);
            }

            if (animation.style.brightness != null) {
                const anim = new Animated(
                    PostProcessing,
                    'brightness',
                    world.postProcessing.brightness,
                    animation.style.brightness,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerSceneComponent(anim);
            }

            if (animation.style.sharpness != null) {
                const anim = new Animated(
                    PostProcessing,
                    'sharpness',
                    world.postProcessing.sharpness,
                    animation.style.sharpness,
                    animation.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerSceneComponent(anim);
            }
        }, [animation]);

        useEffect(() => {
            if (surroundingShadow) {
                world.surroundingDarkMesh.mesh.visible = surroundingShadow.show;
                world.surroundingDarkMesh.mesh.position.z = surroundingShadow.z;
            } else {
                world.surroundingDarkMesh.mesh.visible = false;
            }
        }, [surroundingShadow]);

        useEffect(() => {
            const applyVfxMesh = (
                kind: DramatizeEnums.DirectorSceneSpecialEffectKind,
                config: LibTypes.FrozenGeneralObj,
            ): boolean => {
                if (!world.enableEffectMesh(kind)) return false;

                const mesh = world.getEffectMesh(kind)!;
                mesh.uniforms.intensity.value = Number(
                    config['intensity'] ?? 0.8,
                );
                mesh.uniforms.speed.value = Number(config['speed'] ?? 1.0);

                if (config['repeat'] === false) {
                    setTimeout(
                        () => {
                            world.disableEffectMesh(kind);
                        },
                        Number(config['durationMS'] ?? 500),
                    );
                }

                specialEffectCleanups.current.push(() => {
                    world.disableEffectMesh(kind);
                });

                return true;
            };

            for (const specialEffect of specialEffects ?? []) {
                const sfxConfig =
                    specialEffect.config as LibTypes.FrozenGeneralObj;

                switch (specialEffect.kind) {
                    case DramatizeEnums.DirectorSceneSpecialEffectKind.Snow: {
                        if (applyVfxMesh(specialEffect.kind, sfxConfig)) {
                            world.effectMeshes.snow.uniforms.depth.value =
                                Number(sfxConfig['depth'] ?? 0.5);
                        }
                        break;
                    }
                    case DramatizeEnums.DirectorSceneSpecialEffectKind.Flare: {
                        if (applyVfxMesh(specialEffect.kind, sfxConfig)) {
                            world.effectMeshes.flare.uniforms.type.value =
                                Number(sfxConfig['type'] ?? 1.0);
                        }
                        break;
                    }
                    case DramatizeEnums.DirectorSceneSpecialEffectKind.Shake: {
                        world.registerComponent(
                            ROOT_CONTAINER_ID,
                            new SinusoidalShaking(
                                Number(sfxConfig['amplitude'] ?? 1),
                                Number(sfxConfig['speed'] ?? 1),
                            ),
                        );

                        if (sfxConfig['repeat'] === false) {
                            setTimeout(
                                () => {
                                    world.removeComponent(
                                        ROOT_CONTAINER_ID,
                                        SinusoidalShaking.name,
                                    );
                                },
                                Number(sfxConfig['durationMS'] ?? 500),
                            );
                        }

                        specialEffectCleanups.current.push(() => {
                            world.removeComponent(
                                ROOT_CONTAINER_ID,
                                SinusoidalShaking.name,
                            );
                        });

                        break;
                    }
                    case DramatizeEnums.DirectorSceneSpecialEffectKind
                        .FilmFilter: {
                        const filmFilterMesh = world.filmFilterMesh;
                        filmFilterMesh.uniforms.speed.value = Number(
                            sfxConfig['playSpeed'] ?? 8.0,
                        );
                        filmFilterMesh.uniforms.blackLineWidth.value = Number(
                            sfxConfig['blackLineWidth'] ?? 0.015,
                        );
                        filmFilterMesh.uniforms.dotSize.value = Number(
                            sfxConfig['dotSize'] ?? 1.0 / 5.0,
                        );

                        filmFilterMesh.mesh.visible = true;

                        if (sfxConfig['repeat'] === false) {
                            setTimeout(
                                () => {
                                    filmFilterMesh.mesh.visible = false;
                                },
                                Number(sfxConfig['durationMS'] ?? 500),
                            );
                        }

                        specialEffectCleanups.current.push(() => {
                            filmFilterMesh.mesh.visible = false;
                        });

                        break;
                    }

                    default: {
                        applyVfxMesh(specialEffect.kind, sfxConfig);
                        break;
                    }
                }
            }
        }, [specialEffects]);

        return <></>;
    },
);
