// @ts-nocheck
import * as THREE from 'three/webgpu';

import { DramatizeEnums } from '$/enums';

import { TextureManager } from '../manager';

import { Animated, type Component, PostProcessing } from './component';
import {
    type AllEffectMeshes,
    type EffectMesh,
    addAllEffectMeshesToScene,
    createAllEffectMeshes,
    disposeAllEffectMeshes,
    updateAllEffectTimes,
} from './effects';
import {
    createContainer,
    createFrameSeq,
    createScene,
    createSprite,
    ensureContainer,
    ensureFrameSeq,
    ensureSprite,
} from './entity';
import { ROOT_CONTAINER_ID } from './misc';
import { createPostProcessing } from './post-processing';
import {
    type FilmFilterMesh,
    type SurroundingDarkMesh,
    type UberMesh,
    createCamera,
    createFilmFilterMesh,
    createMesh,
    createSurroundingDarkMesh,
    disposeEffectMesh,
} from './render';
import {
    animateFilterSystem,
    animateLocateSystem,
    animateMaterialSystem,
    animateTransformSystem,
    animatedPostProcessingSystem,
    externPostProcessingSystem,
    externalFilterSystem,
    externalLocateSystem,
    externalMaterialSystem,
    externalMiscSystem,
    externalParentSystem,
    externalSizeAndAnchorSystem,
    externalTextureSystem,
    externalTransformSystem,
    frameSeqTextureSystem,
    sinusoidalShakingLocateSystem,
    textureRefSyncSystem,
} from './system';

type PlatformContext = LibTypes.FrozenDefine<{ present: () => void }>;

export class World {
    public static readonly MAX_EFFECT_MESHES = 3;

    public constructor(
        context: PlatformContext,
        renderer: THREE.WebGPURenderer,
        width: number,
        height: number,
    ) {
        this.#context = context;
        this.#renderer = renderer;
        this.#renderer.setClearAlpha(0);
        // TODO: comment this to disable pixel ratio.
        this.#renderer.setPixelRatio(window.devicePixelRatio || 1);

        this.#camera = createCamera(width, height);
        this.#scene = new THREE.Scene();
        this.#scene.background = null;

        this.#externalMeshMap = new Map<string, UberMesh>();
        this.#externalContainerMap = new Map<string, THREE.Group>();
        this.#entities = new Map<string, Map<string, Component>>();
        this.#proxyEntities = new Map<string, Map<string, Component>>();

        const scene = createScene();
        this.#sceneEntity = scene.entity;
        this.#sceneProxyComponents = scene;

        this.#lastTime = performance.now();

        this.#run = true;
        this.#suspend = false;
        this.#speed = 1;
        this.#activeEffectMeshKinds = new Set();

        const postProcessingSetup = createPostProcessing(
            this.#renderer,
            this.#scene,
            this.#camera,
        );
        this.#postProcessing = postProcessingSetup.postProcessing;
        this.#colorUniform = postProcessingSetup.colorUniform;
        this.#alphaUniform = postProcessingSetup.alphaUniform;
        this.#blurStrengthUniform = postProcessingSetup.blurStrengthUniform;
        this.#brightnessUniform = postProcessingSetup.brightnessUniform;
        this.#sharpnessUniform = postProcessingSetup.sharpnessUniform;

        this.filmFilterMesh = createFilmFilterMesh(width, height);
        this.surroundingDarkMesh = createSurroundingDarkMesh(width, height);
        this.effectMeshes = createAllEffectMeshes(width, height);
        this.#effectMeshByKind = this.#buildEffectMeshByKind();
        this.textureManager = new TextureManager();
        this.#scene.add(this.filmFilterMesh.mesh);
        this.#scene.add(this.surroundingDarkMesh.mesh);
        addAllEffectMeshesToScene(this.#scene, this.effectMeshes);

        this.#createRootContainer();
    }

    readonly #context: PlatformContext;
    readonly #renderer: THREE.WebGPURenderer;
    readonly #camera;
    readonly #scene;

    readonly #externalMeshMap;
    readonly #externalContainerMap;
    readonly #entities;
    readonly #proxyEntities;
    readonly #sceneEntity;
    readonly #sceneProxyComponents: ReturnType<typeof createScene>;

    #lastTime;
    #run: boolean;
    #suspend: boolean;
    #speed: number;
    readonly #activeEffectMeshKinds: Set<DramatizeEnums.DirectorSceneSpecialEffectKind>;
    readonly #effectMeshByKind: ReadonlyMap<
        DramatizeEnums.DirectorSceneSpecialEffectKind,
        EffectMesh
    >;

    readonly #postProcessing?: THREE.RenderPipeline;
    readonly #colorUniform: THREE.UniformNode<'color', THREE.Color>;
    readonly #alphaUniform: THREE.UniformNode<'float', number>;
    readonly #blurStrengthUniform: THREE.UniformNode<'float', number>;
    readonly #brightnessUniform: THREE.UniformNode<'float', number>;
    readonly #sharpnessUniform: THREE.UniformNode<'float', number>;

    public readonly filmFilterMesh: FilmFilterMesh;
    public readonly surroundingDarkMesh: SurroundingDarkMesh;
    public readonly effectMeshes: AllEffectMeshes;
    public readonly textureManager: TextureManager;

    public get postProcessing(): PostProcessing {
        return this.#sceneProxyComponents[PostProcessing.componentName];
    }

    public set suspend(value: boolean) {
        this.#suspend = value;
    }

    public set speed(value: number) {
        this.#speed = value;
    }

    #buildEffectMeshByKind(): Map<
        DramatizeEnums.DirectorSceneSpecialEffectKind,
        EffectMesh
    > {
        const E = DramatizeEnums.DirectorSceneSpecialEffectKind;
        const m = this.effectMeshes;
        return new Map<
            DramatizeEnums.DirectorSceneSpecialEffectKind,
            EffectMesh
        >([
            [E.Rain, m.rain],
            [E.Storm, m.storm],
            [E.SlantRain, m.srain],
            [E.Fire, m.fire],
            [E.Lightning, m.lightning],
            [E.Arc, m.arc],
            [E.Snow, m.snow],
            [E.Blizzard, m.blizzard],
            [E.Crystal, m.crystal],
            [E.Embers, m.embers],
            [E.Fireworks, m.fireworks],
            [E.Bokeh, m.bokeh],
            [E.Heartbeat, m.heartbeat],
            [E.IntoYou, m.intoyou],
            [E.Stars, m.stars],
            [E.Nebula, m.nebula],
            [E.Flare, m.flare],
            [E.Laser, m.laser],
            [E.Pulse, m.pulse],
            [E.Fog, m.fog],
            [E.VFog, m.vfog],
            [E.Cloud, m.cloud],
            [E.Sandy, m.sandy],
            [E.Ocean, m.ocean],
            [E.Caustic, m.caustic],
            [E.Bonfire, m.bonfire],
            [E.Blaze, m.blaze],
            [E.VHS, m.vhs],
        ]);
    }

    #createRootContainer() {
        const container = this.registerContainer(ROOT_CONTAINER_ID);
        const externalContainer = this.#externalContainerMap.get(container.id);
        if (externalContainer) {
            this.#scene.add(externalContainer);
        }
    }

    public enableEffectMesh(
        kind: DramatizeEnums.DirectorSceneSpecialEffectKind,
    ): boolean {
        if (this.#activeEffectMeshKinds.has(kind)) return true;
        if (this.#activeEffectMeshKinds.size >= World.MAX_EFFECT_MESHES) {
            return false;
        }
        const mesh = this.#effectMeshByKind.get(kind);
        if (mesh === undefined) return false;
        mesh.mesh.visible = true;
        this.#activeEffectMeshKinds.add(kind);
        return true;
    }

    public getEffectMesh(
        kind: DramatizeEnums.DirectorSceneSpecialEffectKind,
    ): EffectMesh | undefined {
        return this.#effectMeshByKind.get(kind);
    }

    public disableEffectMesh(
        kind: DramatizeEnums.DirectorSceneSpecialEffectKind,
    ): void {
        const mesh = this.#effectMeshByKind.get(kind);
        if (mesh !== undefined) {
            mesh.mesh.visible = false;
        }
        this.#activeEffectMeshKinds.delete(kind);
    }

    public disableAllEffectMeshes(): void {
        for (const kind of this.#activeEffectMeshKinds) {
            const mesh = this.#effectMeshByKind.get(kind);
            if (mesh !== undefined) {
                mesh.mesh.visible = false;
            }
        }
        this.#activeEffectMeshKinds.clear();
    }

    public async run() {
        await this.#renderer.init();
        this.#run = true;
        this.animate();
    }

    public async animate() {
        // Avoid to get access to any resource after stop
        if (!this.#run) return;

        const now = performance.now();
        const delta = this.#suspend ? 0 : (now - this.#lastTime) * this.#speed;

        for (const [id, entity] of this.#entities.entries()) {
            const uberMesh = this.#externalMeshMap.get(id);
            const container = this.#externalContainerMap.get(id);
            const object = uberMesh?.mesh ?? container;

            // Pure logic systems
            frameSeqTextureSystem(entity, delta);
            textureRefSyncSystem(entity, this.#entities);
            animateLocateSystem(entity, delta);
            sinusoidalShakingLocateSystem(entity, delta);
            animateTransformSystem(entity, delta);
            animateMaterialSystem(entity, delta);
            animateFilterSystem(entity, delta);

            // External systems for objects
            if (!object) {
                if (entity.has(Transform.componentName)) {
                    const t = Transform.ensureType(entity.get(Transform.componentName));
                    if (entity.has(Animated.componentName + '<' + Transform.componentName + ':scale>') ||
                        [...entity.keys()].some(k => k.includes('transform:scale'))) {
                        console.warn('[World] entity has scale animation but no mesh!', id, 'scale=', t.scale);
                    }
                }
                continue;
            }
            externalMiscSystem(entity, object);
            if (id !== ROOT_CONTAINER_ID) {
                externalParentSystem(
                    entity,
                    this.#externalMeshMap,
                    this.#externalContainerMap,
                    object,
                );
            }
            externalLocateSystem(entity, object);
            externalTransformSystem(entity, object);
            // External systems for meshes
            if (!uberMesh) continue;
            externalSizeAndAnchorSystem(entity, uberMesh.mesh);
            externalMaterialSystem(entity, uberMesh);
            externalTextureSystem(entity, uberMesh);
            externalFilterSystem(entity, uberMesh.uniforms.blurStrength);
        }

        animatedPostProcessingSystem(this.#sceneEntity, delta);
        externPostProcessingSystem(
            this.#sceneEntity,
            this.#colorUniform,
            this.#alphaUniform,
            this.#blurStrengthUniform,
            this.#brightnessUniform,
            this.#sharpnessUniform,
        );

        // Update film filter time
        this.filmFilterMesh.uniforms.time.value += delta / 1000;

        // Update all VFX effect times
        updateAllEffectTimes(this.effectMeshes, delta / 1000);

        if (this.#postProcessing) {
            await this.#postProcessing.render();
        } else {
            await this.#renderer.render(this.#scene, this.#camera);
        }
        this.#context.present();
        this.#lastTime = now;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.#run) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    public registerSprite(id: string) {
        if (this.#entities.has(id)) {
            const proxyEntity = this.#proxyEntities.get(id);
            if (!proxyEntity) throw new Error('proxyEntity is undefined');
            const sprite = ensureSprite(proxyEntity);

            return {
                id,
                ...sprite,
            };
        }
        const { entity, proxyEntity, ...other } = createSprite();

        this.#entities.set(id, entity);
        this.#proxyEntities.set(id, proxyEntity);

        const uberMesh = createMesh();
        this.#externalMeshMap.set(id, uberMesh);

        return {
            id,
            ...other,
        };
    }

    public registerFrameSeq(id: string) {
        if (this.#entities.has(id)) {
            const proxyEntity = this.#proxyEntities.get(id);
            if (!proxyEntity) throw new Error('proxyEntity is undefined');
            const frameSeq = ensureFrameSeq(proxyEntity);

            return {
                id,
                ...frameSeq,
            };
        }
        const { entity, proxyEntity, ...other } = createFrameSeq();

        this.#entities.set(id, entity);
        this.#proxyEntities.set(id, proxyEntity);

        const uberMesh = createMesh();
        this.#externalMeshMap.set(id, uberMesh);

        return {
            id,
            ...other,
        };
    }

    public registerContainer(id: string) {
        if (this.#entities.has(id)) {
            const proxyEntity = this.#proxyEntities.get(id);
            if (!proxyEntity) throw new Error('proxyEntity is undefined');
            const container = ensureContainer(proxyEntity);

            return {
                id,
                ...container,
            };
        }
        const { entity, proxyEntity, ...other } = createContainer();

        this.#entities.set(id, entity);
        this.#proxyEntities.set(id, proxyEntity);
        const externalContainer = new THREE.Group();
        this.#externalContainerMap.set(id, externalContainer);

        return {
            id,
            ...other,
        };
    }

    public registerComponent(id: string, component: Component) {
        const entity = this.#entities.get(id);
        if (!entity) {
            throw new Error(`Entity with id ${id} does not exist`);
        }

        const componentName = component.meta ?? component.constructor.name;
        entity.set(componentName, component);
    }

    public removeComponent(id: string, componentName: string) {
        const entity = this.#entities.get(id);
        if (!entity) return;

        entity.delete(componentName);
    }

    public removeAnimationComponents(id: string) {
        const entity = this.#entities.get(id);
        if (!entity) return;

        for (const componentName of entity.keys()) {
            if (componentName.startsWith(`${Animated.componentName}<`)) {
                entity.delete(componentName);
            }
        }
    }

    public registerSceneComponent(component: Component) {
        const componentName = component.meta ?? component.constructor.name;

        this.#sceneEntity.set(componentName, component);
    }

    public hasEntity(id: string): boolean {
        return this.#entities.has(id);
    }

    public removeSceneComponent(componentName: string) {
        this.#sceneEntity.delete(componentName);
    }

    public removeSceneAnimatedComponents() {
        for (const componentName of this.#sceneEntity.keys()) {
            if (componentName.startsWith(`${Animated.componentName}<`)) {
                this.#sceneEntity.delete(componentName);
            }
        }
    }

    public cleanEntity(id: string) {
        const entity = this.#entities.get(id);

        if (entity) {
            this.#entities.delete(id);
        }

        // Clean up proxy entity
        const proxyEntity = this.#proxyEntities.get(id);
        if (proxyEntity) {
            proxyEntity.clear();
            this.#proxyEntities.delete(id);
        }

        const container = this.#externalContainerMap.get(id);
        if (container) {
            this.#scene.remove(container);
            this.#externalContainerMap.delete(id);
        }

        const uberMesh = this.#externalMeshMap.get(id);

        if (uberMesh) {
            uberMesh.mesh.parent?.remove(uberMesh.mesh);
            this.#externalMeshMap.delete(id);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const material = uberMesh.mesh
                .material as THREE.MeshBasicNodeMaterial;
            material.dispose();
            uberMesh.mesh.geometry.dispose();
        }
    }

    public clearWorld() {
        this.#run = false;

        // Clear active effect mesh tracking
        this.#activeEffectMeshKinds.clear();

        // Clear entities and proxy entities
        this.#entities.clear();
        this.#proxyEntities.clear();

        // Clear scene entity
        this.#sceneEntity.clear();
        // Dispose all meshes
        this.#externalMeshMap.forEach(({ mesh }) => {
            this.#scene.remove(mesh);
            mesh.geometry.dispose();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const material = mesh.material as THREE.MeshBasicNodeMaterial;
            const texture = material.map;
            if (texture) {
                texture.dispose();
            }
            material.dispose();
        });
        this.#externalMeshMap.clear();

        this.textureManager.dispose();

        this.#externalContainerMap.forEach(container => {
            this.#scene.remove(container);
        });
        this.#externalContainerMap.clear();

        // Dispose effect meshes
        disposeEffectMesh(this.#scene, this.filmFilterMesh);
        disposeEffectMesh(this.#scene, this.surroundingDarkMesh);
        disposeAllEffectMeshes(this.#scene, this.effectMeshes);

        // Dispose postProcessing
        if (this.#postProcessing) {
            this.#postProcessing.dispose();
        }

        // Clear scene
        this.#scene.clear();

        // Dispose renderer (should be last)
        this.#renderer.dispose();
    }
}
