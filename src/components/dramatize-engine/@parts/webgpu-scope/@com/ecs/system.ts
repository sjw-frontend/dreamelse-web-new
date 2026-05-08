import * as THREE from 'three/webgpu';

import {
    Anchor,
    Animated,
    type Component,
    Filter,
    Frames,
    Material,
    Misc,
    Parent,
    Position,
    PostProcessing,
    SinusoidalShaking,
    Size,
    Texture,
    TextureRef,
    Transform,
} from './component';
import type { UberMesh } from './render';

export const externalMiscSystem = (
    entity: Map<string, Component>,
    mesh: THREE.Object3D,
) => {
    if (!entity.has(Misc.componentName)) return;
    const misc = Misc.ensureType(entity.get(Misc.componentName));

    mesh.visible = misc.visible;
};

export const externalLocateSystem = (
    entity: Map<string, Component>,
    object: THREE.Object3D,
) => {
    const hasPosition = entity.has(Position.componentName);
    if (!hasPosition) return;

    const hasShaking = entity.has(SinusoidalShaking.componentName);
    let offsetX = 0;
    let offsetY = 0;
    if (hasShaking) {
        const shaking = SinusoidalShaking.ensureType(
            entity.get(SinusoidalShaking.componentName),
        );
        offsetX = shaking.offsetX;
        offsetY = shaking.offsetY;
    }

    const hasTransform = entity.has(Transform.componentName);
    let transformX = 0;
    let transformY = 0;
    if (hasTransform) {
        const transform = Transform.ensureType(entity.get(Transform.componentName));
        transformX = transform.x;
        transformY = transform.y;
    }

    const position = Position.ensureType(entity.get(Position.componentName));
    const zValue =
        object.parent instanceof THREE.Mesh
            ? (position.z + 0.1) / 10000
            : position.z + 0.1;

    object.position.set(
        position.x + offsetX + transformX,
        position.y + offsetY + transformY,
        zValue,
    );
};

export const externalSizeAndAnchorSystem = (
    entity: Map<string, Component>,
    mesh: THREE.Mesh,
) => {
    if (!entity.has(Size.componentName)) return;
    const size = Size.ensureType(entity.get(Size.componentName));
    const geometry = mesh.geometry;

    if (geometry instanceof THREE.PlaneGeometry) {
        const hasAnchor = entity.has(Anchor.componentName);
        const anchor = hasAnchor
            ? Anchor.ensureType(entity.get(Anchor.componentName))
            : null;
        const anchorX = anchor?.x ?? 0;
        const anchorY = anchor?.y ?? 0;

        // Check if size has changed
        const sizeChanged =
            geometry.parameters.width !== size.width ||
            geometry.parameters.height !== size.height;

        const prevAnchorX =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (geometry.userData['anchorX'] as number | undefined) ?? 0;
        const prevAnchorY =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (geometry.userData['anchorY'] as number | undefined) ?? 0;
        const anchorChanged =
            prevAnchorX !== anchorX || prevAnchorY !== anchorY;

        if (sizeChanged || anchorChanged) {
            mesh.geometry.dispose();
            const newGeometry = new THREE.PlaneGeometry(
                size.width,
                size.height,
            );

            // Apply anchor translation if needed
            if (anchorX !== 0 || anchorY !== 0) {
                // Negative values because we're moving the geometry, not the pivot
                newGeometry.translate(-anchorX, -anchorY, 0);
                console.log(
                    `Applied anchor translation: (${anchorX}, ${anchorY})`,
                );
            }

            // Store current anchor values for future comparison
            newGeometry.userData['anchorX'] = anchorX;
            newGeometry.userData['anchorY'] = anchorY;

            mesh.geometry = newGeometry;
        }
    }
};

export const externalTransformSystem = (
    entity: Map<string, Component>,
    mesh: THREE.Object3D,
) => {
    if (!entity.has(Transform.componentName)) return;
    const transform = Transform.ensureType(entity.get(Transform.componentName));

    mesh.scale.set(transform.scale, transform.scale, 1);
    mesh.rotation.z = transform.rotation;
};

export const externalTextureSystem = (
    entity: Map<string, Component>,
    uberMesh: UberMesh,
) => {
    if (!entity.has(Texture.componentName)) return;
    const texture = Texture.ensureType(entity.get(Texture.componentName));

    uberMesh.uniforms.enableTexture.value = texture.enable ? 1 : -1;

    if (uberMesh.nodes.textureNode.value !== texture.image && texture.image) {
        uberMesh.nodes.textureNode.value = texture.image;
    }
};

export const externalMaterialSystem = (
    entity: Map<string, Component>,
    uberMesh: UberMesh,
) => {
    if (!entity.has(Material.componentName)) return;
    const material = Material.ensureType(entity.get(Material.componentName));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const externalMaterial = uberMesh.mesh
        .material as THREE.MeshBasicNodeMaterial;

    externalMaterial.opacity = material.opacity;
    uberMesh.uniforms.brightness.value = new THREE.Color(
        material.brightness,
        material.brightness,
        material.brightness,
    );
    uberMesh.uniforms.color.value.set(material.color);
};

export const externalFilterSystem = (
    entity: Map<string, Component>,
    externalBlurStrength: THREE.UniformNode<'float', number>,
) => {
    if (!entity.has(Filter.componentName)) return;
    const filter = Filter.ensureType(entity.get(Filter.componentName));
    const clampedBlur = THREE.MathUtils.clamp(filter.blur, 0, 1);
    const remappedBlur = THREE.MathUtils.mapLinear(clampedBlur, 0, 1, 0, 0.01);

    externalBlurStrength.value = remappedBlur;
};

export const externalParentSystem = (
    entity: Map<string, Component>,
    externalMeshMap: Map<string, UberMesh>,
    externalContainerMap: Map<string, THREE.Object3D>,
    object: THREE.Object3D,
) => {
    if (!entity.has(Parent.componentName)) return;

    const parentComponent = Parent.ensureType(entity.get(Parent.componentName));
    const parent =
        externalContainerMap.get(parentComponent.id) ??
        externalMeshMap.get(parentComponent.id)?.mesh;

    const externalParent = object.parent;

    if (externalParent !== parent) {
        externalParent?.remove(object);
        parent?.add(object);
    }
};

export const externPostProcessingSystem = (
    entity: Map<string, Component>,
    colorUniform: THREE.UniformNode<'color', THREE.Color>,
    alphaUniform: THREE.UniformNode<'float', number>,
    blurUniform: THREE.UniformNode<'float', number>,
    brightnessUniform: THREE.UniformNode<'float', number>,
    sharpnessUniform: THREE.UniformNode<'float', number>,
) => {
    if (!entity.has(PostProcessing.componentName)) return;
    const postProcessing = PostProcessing.ensureType(
        entity.get(PostProcessing.componentName),
    );

    colorUniform.value.set(postProcessing.color);
    alphaUniform.value = postProcessing.opacity;
    blurUniform.value = postProcessing.blur;
    brightnessUniform.value = postProcessing.brightness;
    sharpnessUniform.value = postProcessing.sharpness;
};

export const textureRefSyncSystem = (
    entity: Map<string, Component>,
    entities: Map<string, Map<string, Component>>,
) => {
    if (!entity.has(TextureRef.componentName)) return;
    const textureRef = TextureRef.ensureType(entity.get(TextureRef.componentName));

    if (textureRef.id == null) return;
    const targetEntity = entities.get(textureRef.id);

    if (!targetEntity) return;
    if (!targetEntity.has(Texture.componentName)) return;

    const targetTexture = Texture.ensureType(targetEntity.get(Texture.componentName));
    const texture = Texture.ensureType(entity.get(Texture.componentName));

    texture.image = targetTexture.image;
    texture.enable = targetTexture.enable;
};

export const frameSeqTextureSystem = (
    entity: Map<string, Component>,
    delta: number,
) => {
    if (!entity.has(Frames.componentName)) return;

    const frames = Frames.ensureType(entity.get(Frames.componentName));
    if (frames.images.length === 0 || !frames.play) return;

    const texture = Texture.ensureType(entity.get(Texture.componentName));

    if (frames.images[frames.index]) {
        texture.image = frames.images[frames.index] ?? null;
    }

    frames.elasped += delta;

    if (frames.elasped >= frames.interval) {
        frames.elasped = 0;

        if (frames.loop) {
            frames.index = (frames.index + 1) % frames.images.length;
        } else {
            frames.index = Math.min(frames.index + 1, frames.images.length - 1);
        }
    }
};

const calcProgress = (
    delta: number,
    duration: number,
    currentProgress: number,
    speed: number,
) => {
    if (duration === 0) return 1;
    const increment = (delta / duration) * speed;
    return THREE.MathUtils.clamp(currentProgress + increment, 0, 1);
};

const handleAnimationLoop = (
    entity: Map<string, Component>,
    animatedName: string,
    animated: LibTypes.VarDefine<{
        loop: boolean,
        loopBack: boolean,
        speed: number,
        progress: number,
    }>,
    progress: number,
    onComplete?: () => void,
) => {
    if (progress >= 1) {
        if (!animated.loop) {
            entity.delete(animatedName);
            onComplete?.();
        } else if (animated.loopBack) {
            animated.speed *= -1;
        } else {
            animated.progress = 0;
        }
    } else if (progress <= 0 && animated.loop && animated.loopBack) {
        animated.speed *= -1;
    }
};

export const animateLocateSystem = (
    entity: Map<string, Component>,
    delta: number,
) => {
    if (!entity.has(Position.componentName)) return;
    const region = Position.ensureType(entity.get(Position.componentName));

    // Process all animated components for this Position
    for (const [key, component] of entity.entries()) {
        if (!key.startsWith(`${Animated.componentName}<${Position.componentName}:`)) continue;
        if (!(component instanceof Animated)) continue;
        if (component.targetComponentClass !== Position) continue;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const animatedRegion = component as Animated<Position, keyof Position>;

        animatedRegion.progress = calcProgress(
            delta,
            animatedRegion.duration,
            animatedRegion.progress,
            animatedRegion.speed,
        );

        const progress = animatedRegion.progress;
        const prop = animatedRegion.property;

        if (prop === 'x' || prop === 'y' || prop === 'z') {
            region[prop] = THREE.MathUtils.lerp(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedRegion.from as unknown as number,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedRegion.to as unknown as number,
                progress,
            );
        }

        handleAnimationLoop(entity, key, animatedRegion, progress, animatedRegion.onComplete);
    }
};

export const sinusoidalShakingLocateSystem = (
    entity: Map<string, Component>,
    delta: number,
) => {
    if (!entity.has(SinusoidalShaking.componentName)) return;
    const shaking = SinusoidalShaking.ensureType(
        entity.get(SinusoidalShaking.componentName),
    );

    shaking.elapsed += delta;

    shaking.offsetX =
        Math.sin(shaking.elapsed * shaking.speed) * shaking.amplitude;
    shaking.offsetY =
        Math.cos(shaking.elapsed * shaking.speed * 1.3) * shaking.amplitude;
};

export const animateTransformSystem = (
    entity: Map<string, Component>,
    delta: number,
) => {
    if (!entity.has(Transform.componentName)) return;
    const transform = Transform.ensureType(entity.get(Transform.componentName));

    // Process all animated components for this Transform
    for (const [key, component] of entity.entries()) {
        if (!key.startsWith(`${Animated.componentName}<${Transform.componentName}:`)) continue;
        if (!(component instanceof Animated)) continue;
        if (component.targetComponentClass !== Transform) continue;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const animatedTransform = component as Animated<
            Transform,
            keyof Transform
        >;

        animatedTransform.progress = calcProgress(
            delta,
            animatedTransform.duration,
            animatedTransform.progress,
            animatedTransform.speed,
        );
        const progress = animatedTransform.progress;
        const prop = animatedTransform.property;

        if (
            prop === 'scale' ||
            prop === 'rotation' ||
            prop === 'x' ||
            prop === 'y'
        ) {
            transform[prop] = THREE.MathUtils.lerp(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedTransform.from as unknown as number,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedTransform.to as number,
                progress,
            );
        }

        handleAnimationLoop(entity, key, animatedTransform, progress, animatedTransform.onComplete);
    }
};

export const animateMaterialSystem = (
    entity: Map<string, Component>,
    delta: number,
) => {
    if (!entity.has(Material.componentName)) return;
    const material = Material.ensureType(entity.get(Material.componentName));

    for (const [key, component] of entity.entries()) {
        if (!key.startsWith(`${Animated.componentName}<${Material.componentName}:`)) continue;
        if (!(component instanceof Animated)) continue;
        if (component.targetComponentClass !== Material) continue;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const animatedMaterial = component as Animated<
            Material,
            keyof Material
        >;

        animatedMaterial.progress = calcProgress(
            delta,
            animatedMaterial.duration,
            animatedMaterial.progress,
            animatedMaterial.speed,
        );
        const progress = animatedMaterial.progress;
        const prop = animatedMaterial.property;

        if (prop === 'color') {
            material.color = `#${new THREE.Color()
                .lerpColors(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    new THREE.Color(animatedMaterial.from as string),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    new THREE.Color(animatedMaterial.to as string),
                    progress,
                )
                .getHexString()}`;
        } else if (prop === 'opacity' || prop === 'brightness') {
            material[prop] = THREE.MathUtils.lerp(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedMaterial.from as number,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedMaterial.to as number,
                progress,
            );
        }

        handleAnimationLoop(entity, key, animatedMaterial, progress, animatedMaterial.onComplete);
    }
};

export const animateFilterSystem = (
    entity: Map<string, Component>,
    delta: number,
) => {
    if (!entity.has(Filter.componentName)) return;
    const filter = Filter.ensureType(entity.get(Filter.componentName));

    for (const [key, component] of entity.entries()) {
        if (!key.startsWith(`${Animated.componentName}<${Filter.componentName}:`)) continue;
        if (!(component instanceof Animated)) continue;
        if (component.targetComponentClass !== Filter) continue;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const animatedFilter = component as Animated<Filter, keyof Filter>;

        animatedFilter.progress = calcProgress(
            delta,
            animatedFilter.duration,
            animatedFilter.progress,
            animatedFilter.speed,
        );
        const progress = animatedFilter.progress;
        const prop = animatedFilter.property;

        if (prop === 'blur') {
            filter.blur = THREE.MathUtils.lerp(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedFilter.from as number,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedFilter.to as number,
                progress,
            );
        }

        handleAnimationLoop(entity, key, animatedFilter, progress, animatedFilter.onComplete);
    }
};

export const animatedPostProcessingSystem = (
    entity: Map<string, Component>,
    delta: number,
) => {
    if (!entity.has(PostProcessing.componentName)) return;
    const postProcessing = PostProcessing.ensureType(
        entity.get(PostProcessing.componentName),
    );

    // Process all animated components for this PostProcessing
    for (const [key, component] of entity.entries()) {
        if (!key.startsWith(`${Animated.componentName}<${PostProcessing.componentName}:`)) {
            continue;
        }
        if (!(component instanceof Animated)) continue;
        if (component.targetComponentClass !== PostProcessing) continue;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const animatedPostProcessing = component as Animated<
            PostProcessing,
            keyof PostProcessing
        >;

        animatedPostProcessing.progress = calcProgress(
            delta,
            animatedPostProcessing.duration,
            animatedPostProcessing.progress,
            animatedPostProcessing.speed,
        );
        const progress = animatedPostProcessing.progress;
        const prop = animatedPostProcessing.property;

        if (prop === 'color') {
            postProcessing.color = `#${new THREE.Color()
                .lerpColors(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    new THREE.Color(animatedPostProcessing.from as string),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    new THREE.Color(animatedPostProcessing.to as string),
                    progress,
                )
                .getHexString()}`;
        } else if (
            prop === 'opacity' ||
            prop === 'blur' ||
            prop === 'brightness' ||
            prop === 'sharpness'
        ) {
            postProcessing[prop] = THREE.MathUtils.lerp(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedPostProcessing.from as number,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                animatedPostProcessing.to as number,
                progress,
            );
        }

        handleAnimationLoop(entity, key, animatedPostProcessing, progress, animatedPostProcessing.onComplete);
    }
};
