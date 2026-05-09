/* eslint-disable */
import * as THREE from 'three/webgpu';
import {
    Fn,
    texture,
    uv,
    vec3,
    vec4,
    float,
    mix,
    clamp,
    uniform,
} from 'three/tsl';

type ShadeEffectOptions = {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicNodeMaterial;
    mixers?: THREE.AnimationMixer[];
    duration?: number;
    startBrightness: number;
    endBrightness: number;
};

export const applyShadeEffect = ({
    mesh,
    material,
    mixers,
    duration = 2.0,
    startBrightness,
    endBrightness,
}: ShadeEffectOptions): void => {
    // Initialize material color to start brightness
    material.color = new THREE.Color(
        startBrightness,
        startBrightness,
        startBrightness,
    );

    // Create a temporary mixer for the shade effect
    const effectMixer = new THREE.AnimationMixer(mesh);
    mixers?.push(effectMixer);

    // Create color track from start to end brightness
    const colorTrack = new THREE.ColorKeyframeTrack(
        '.material.color',
        [0, duration],
        [
            startBrightness,
            startBrightness,
            startBrightness,
            endBrightness,
            endBrightness,
            endBrightness,
        ],
    );

    // Create animation clip
    const clip = new THREE.AnimationClip('shade', duration, [colorTrack]);
    const action = effectMixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();

    // Clean up effect mixer after animation completes and set final color
    setTimeout(() => {
        // Ensure final color is at end brightness
        material.color = new THREE.Color(
            endBrightness,
            endBrightness,
            endBrightness,
        );

        const index = mixers?.indexOf(effectMixer);
        if (index !== undefined && index > -1) {
            mixers?.splice(index, 1);
        }
        effectMixer.stopAllAction();
    }, duration * 1000);
};

// Convenience wrappers for common use cases
export const applyShadeInEffect = (
    options: Omit<ShadeEffectOptions, 'startBrightness' | 'endBrightness'> & {
        startBrightness?: number;
        endBrightness?: number;
    },
) =>
    applyShadeEffect({
        ...options,
        startBrightness: options.startBrightness ?? 0,
        endBrightness: options.endBrightness ?? 1.0,
    });

export const applyShadeOutEffect = (
    options: Omit<ShadeEffectOptions, 'startBrightness' | 'endBrightness'> & {
        startBrightness?: number;
        endBrightness?: number;
    },
) =>
    applyShadeEffect({
        ...options,
        startBrightness: options.startBrightness ?? 1.0,
        endBrightness: options.endBrightness ?? 0,
    });

type FlashEffectOptions = {
    material: THREE.MeshBasicNodeMaterial;
    duration?: number;
    flashColor?: 'white' | 'black';
};

export const applyFlashEffect = ({
    material,
    duration = 0.5,
    flashColor = 'white',
}: FlashEffectOptions): void => {
    // Get the original texture
    const originalTexture = material.map;

    if (!originalTexture) {
        console.warn('No texture found on material for flash effect');
        return;
    }

    // Create a uniform node for time that we can update
    const timeUniform = uniform(0);

    // Determine flash color based on parameter
    const targetColor =
        flashColor === 'white' ? vec3(1.0, 1.0, 1.0) : vec3(0.0, 0.0, 0.0);

    // Create TSL shader node for flash effect
    material.colorNode = Fn(() => {
        const textureNode = texture(originalTexture);
        const uvNode = uv();
        const color = textureNode.sample(uvNode);

        // Calculate flash intensity: 1.0 at start, 0.0 at end (quick decay)
        const flashIntensity = float(1.0).sub(
            clamp(timeUniform.mul(2.0), 0.0, 1.0),
        );

        // Mix between original color and target flash color based on flash intensity
        const finalColor = mix(color.rgb, targetColor, flashIntensity);

        return vec4(finalColor, color.a);
    })();

    material.needsUpdate = true;

    // Animate the time uniform from 0 to 1 over the duration
    const startTime = performance.now();
    let animationId: number;

    const animate = () => {
        const currentTime = performance.now();
        const elapsed = (currentTime - startTime) / 1000; // Convert to seconds
        const progress = Math.min(elapsed / duration, 1.0);

        timeUniform.value = progress;

        if (progress < 1.0) {
            animationId = requestAnimationFrame(animate);
        } else {
            // Animation complete - restore original material
            material.colorNode = Fn(() => {
                const textureNode = texture(originalTexture);
                const uvNode = uv();
                return textureNode.sample(uvNode);
            })();
            material.needsUpdate = true;
        }
    };

    animationId = requestAnimationFrame(animate);
    console.log(animationId);
};

// Convenience wrappers for specific flash effects
export const applyFlashWhiteEffect = (
    options: Omit<FlashEffectOptions, 'flashColor'>,
) => applyFlashEffect({ ...options, flashColor: 'white' });

export const applyFlashBlackEffect = (
    options: Omit<FlashEffectOptions, 'flashColor'>,
) => applyFlashEffect({ ...options, flashColor: 'black' });

type VibrateEffectOptions = {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicNodeMaterial;
    scene: THREE.Scene;
    mixers?: THREE.AnimationMixer[];
    duration?: number;
    startAlpha?: number;
    targetAlpha?: number;
    targetScale?: number;
};

export const applyVibrateEffect = ({
    mesh,
    material,
    scene,
    mixers,
    duration = 0.5,
    startAlpha = 0.6,
    targetAlpha = 0,
    targetScale = 1.5,
}: VibrateEffectOptions): void => {
    // Create a copy of the mesh for the vibrate animation
    const geometry = (mesh.geometry as THREE.PlaneGeometry).clone();
    const copyMaterial = new THREE.MeshBasicMaterial({
        map: material.map,
        transparent: true,
        opacity: startAlpha,
        side: THREE.DoubleSide,
    });
    const meshCopy = new THREE.Mesh(geometry, copyMaterial);

    // Position the copy at the same location as the original, slightly in front
    meshCopy.position.copy(mesh.position);
    meshCopy.position.z += 0.1;
    meshCopy.scale.copy(mesh.scale);

    // Add copy to scene
    scene.add(meshCopy);

    // Create animation mixer for the copy
    const effectMixer = new THREE.AnimationMixer(meshCopy);
    mixers?.push(effectMixer);

    // Get the current scale
    const currentScale = mesh.scale.x;

    // Create scale animation track (expand from current scale to target)
    const scaleTrack = new THREE.VectorKeyframeTrack(
        '.scale',
        [0, duration],
        [
            currentScale,
            currentScale,
            currentScale,
            currentScale * targetScale,
            currentScale * targetScale,
            currentScale,
        ],
    );

    // Create opacity animation track (fade out)
    const opacityTrack = new THREE.NumberKeyframeTrack(
        '.material.opacity',
        [0, duration],
        [startAlpha, targetAlpha],
    );

    // Create animation clip
    const clip = new THREE.AnimationClip('vibrate', duration, [
        scaleTrack,
        opacityTrack,
    ]);
    const action = effectMixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();

    // Clean up after a few cycles (e.g., 2 seconds total)
    const cleanupTime = 2000;
    setTimeout(() => {
        const index = mixers?.indexOf(effectMixer);
        if (index !== undefined && index > -1) {
            mixers?.splice(index, 1);
        }
        effectMixer.stopAllAction();
        scene.remove(meshCopy);
        geometry.dispose();
        copyMaterial.dispose();
    }, cleanupTime);
};
