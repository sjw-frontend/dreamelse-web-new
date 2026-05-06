// @ts-nocheck
/* eslint-disable */

import type { RNCanvasContext, NativeCanvas } from 'react-native-wgpu';
import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';

import { ReactNativeCanvas } from '../canvas';

const DEFAULT_MESH_POSITION = { x: 0, y: 0, z: 0 };

export const createTexture = (imageBitmap: ImageBitmap): THREE.Texture => {
    const texture = new THREE.Texture(imageBitmap);
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
};

export type UberMesh = {
    mesh: THREE.Mesh;
    uniforms: {
        blurStrength: THREE.UniformNode<'float', number>;
        color: THREE.UniformNode<'color', THREE.Color>;
        brightness: THREE.UniformNode<'color', THREE.Color>;
        enableTexture: THREE.UniformNode<'float', number>;
    };
    nodes: {
        textureNode: THREE.TextureNode;
    };
};

// const createPlaceholderTexture = (): THREE.DataTexture => {
//     const tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
//     tex.flipY = false;
//     tex.colorSpace = THREE.SRGBColorSpace;
//     return tex;
// };

const SAMPLE_RANGE_COUNT = 121;
export const createMesh = (): UberMesh => {
    const geometry = new THREE.PlaneGeometry(1, 1);

    const texture = new THREE.Texture();
    const material = new THREE.MeshBasicNodeMaterial({
        transparent: true,
        color: 0xffffff,
        side: THREE.DoubleSide,
    });

    const sampleCount = SAMPLE_RANGE_COUNT;
    const blurStrengthUniform = TSL.uniform(0);
    const colorUniform = TSL.uniform(new THREE.Color(1, 1, 1));
    const brightnessUniform = TSL.uniform(new THREE.Color(1, 1, 1));
    const enableTextureUniform = TSL.uniform(1);
    const textureNode = TSL.texture(texture);

    material.colorNode = TSL.Fn(() => {
        const blurAmount = TSL.float(blurStrengthUniform);

        const uvNode = TSL.uv();

        const color = TSL.vec4(1, 1, 1, 1).toVar();

        TSL.If(enableTextureUniform.greaterThan(0), () => {
            TSL.If(blurAmount.greaterThan(0), () => {
                TSL.Loop(sampleCount, ({ i }) => {
                    const idx = TSL.float(i);
                    const x = TSL.float(idx)
                        .sub(TSL.floor(idx.div(10)).mul(10))
                        .sub(5);
                    const y = TSL.floor(idx.div(10)).sub(5);
                    const offset = TSL.vec2(x, y);

                    const sampleUV = uvNode.add(offset.mul(blurAmount));
                    color.addAssign(textureNode.sample(sampleUV));
                });

                color.divAssign(sampleCount);
            }).Else(() => {
                color.assign(textureNode.sample(uvNode));
            });
        });

        return color.mul(colorUniform).mul(brightnessUniform);
    })();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.position.set(
        DEFAULT_MESH_POSITION.x,
        DEFAULT_MESH_POSITION.y,
        DEFAULT_MESH_POSITION.z,
    );

    return {
        mesh,
        uniforms: {
            blurStrength: blurStrengthUniform,
            color: colorUniform,
            brightness: brightnessUniform,
            enableTexture: enableTextureUniform,
        },
        nodes: {
            textureNode,
        },
    };
};

export const createRenderer = (context: RNCanvasContext) =>
    new THREE.WebGPURenderer({
        alpha: true,
        antialias: true,
        canvas: new ReactNativeCanvas(
            context.canvas as unknown as NativeCanvas,
        ),
        context,
    } as unknown as ConstructorParameters<typeof THREE.WebGPURenderer>[0]);

const CAMERA_NEAR = 0;
const CAMERA_FAR = 10002;
// const CAMERA_LEFT = 0;
// const CAMERA_TOP = 0;
export const createCamera = (width: number, height: number) => {
    const camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        CAMERA_NEAR,
        CAMERA_FAR,
    );

    camera.position.set(0, 0, 10001);

    return camera;
};

export type FilmFilterMesh = {
    mesh: THREE.Mesh;
    uniforms: {
        time: THREE.UniformNode<'float', number>;
        speed: THREE.UniformNode<'float', number>;
        blackLineWidth: THREE.UniformNode<'float', number>;
        dotSize: THREE.UniformNode<'float', number>;
    };
};

export const createFilmFilterMesh = (
    width: number,
    height: number,
): FilmFilterMesh => {
    const geometry = new THREE.PlaneGeometry(width, height);

    const timeUniform = TSL.uniform(0.0);
    const speedUniform = TSL.uniform(8.0);
    const blackLineWidthUniform = TSL.uniform(0.015);
    const dotSizeUniform = TSL.uniform(1.0 / 5.0);

    const material = new THREE.MeshBasicNodeMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    material.colorNode = TSL.Fn(() => {
        const time = timeUniform;
        const uvNode = TSL.uv();

        // Hash functions
        const hash22 = TSL.Fn(([p_immutable]: [THREE.Node<'vec2'>]) => {
            const p = TSL.vec2(p_immutable).toVar();
            p.assign(
                TSL.vec2(
                    TSL.dot(p, TSL.vec2(127.1, 311.7)),
                    TSL.dot(p, TSL.vec2(269.5, 183.3)),
                ),
            );
            const sinP = TSL.vec2(
                TSL.sin(p.x).mul(43758.5453123),
                TSL.sin(p.y).mul(43758.5453123),
            );
            return TSL.vec2(-1.0).add(
                TSL.vec2(2.0).mul(
                    TSL.vec2(TSL.fract(sinP.x), TSL.fract(sinP.y)),
                ),
            );
        });

        const nos = TSL.Fn(([p_immutable]: [THREE.Node<'vec2'>]) => {
            const p = TSL.vec2(p_immutable).toVar();
            const K1 = TSL.float(0.366025404);
            const K2 = TSL.float(0.211324865);
            const i = TSL.floor(p.add(p.x.add(p.y).mul(K1))).toVar();
            const a = p.sub(i.sub(i.x.add(i.y).mul(K2))).toVar();
            const o = TSL.vec2(0.0, 0.0).toVar();
            TSL.If(a.x.lessThan(a.y), () => {
                o.assign(TSL.vec2(0.0, 1.0));
            }).Else(() => {
                o.assign(TSL.vec2(1.0, 0.0));
            });
            const b = a.sub(o).add(K2).toVar();
            const c = a.sub(1.0).add(K2.mul(2.0)).toVar();
            const h = TSL.max(
                TSL.vec3(0.5).sub(
                    TSL.vec3(TSL.dot(a, a), TSL.dot(b, b), TSL.dot(c, c)),
                ),
                0.0,
            ).toVar();
            const n = h
                .mul(h)
                .mul(h)
                .mul(h)
                .mul(
                    TSL.vec3(
                        TSL.dot(a, hash22(i)),
                        TSL.dot(b, hash22(i.add(o))),
                        TSL.dot(c, hash22(i.add(1.0))),
                    ),
                )
                .toVar();
            return TSL.dot(TSL.vec3(70.0), n);
        });

        const rand = TSL.Fn(([co]: [THREE.Node<'vec2'>]) => {
            return TSL.fract(
                TSL.sin(TSL.dot(co, TSL.vec2(12.9898, 78.233))).mul(43758.5453),
            );
        });

        const alpha = TSL.float(0.0).toVar();

        // Scratch effect
        const timeSeed = TSL.floor(speedUniform.mul(time));
        const randOnX = rand(TSL.vec2(timeSeed, 0.0));
        const edge = TSL.smoothstep(
            blackLineWidthUniform,
            0.0,
            TSL.abs(uvNode.x.sub(randOnX)),
        );

        // Add scratch opacity
        alpha.addAssign(edge.mul(0.3));

        // Dot effect
        const dotNoise = nos(
            TSL.vec2(1.0)
                .div(dotSizeUniform)
                .mul(
                    uvNode.add(
                        TSL.vec2(
                            TSL.floor(speedUniform.mul(TSL.fract(time))),
                            0.0,
                        ),
                    ),
                ),
        );
        const dotEffect = TSL.step(dotNoise, -0.75);

        // Add dot opacity
        alpha.addAssign(dotEffect.mul(0.5));

        // Clamp alpha
        alpha.assign(TSL.clamp(alpha, 0.0, 1.0));

        // Return black color with calculated alpha
        return TSL.vec4(0.0, 0.0, 0.0, alpha);
    })();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.position.set(0, 0, 10000);

    return {
        mesh,
        uniforms: {
            time: timeUniform,
            speed: speedUniform,
            blackLineWidth: blackLineWidthUniform,
            dotSize: dotSizeUniform,
        },
    };
};

export type SurroundingDarkMesh = {
    mesh: THREE.Mesh;
};

export const createSurroundingDarkMesh = (
    width: number,
    height: number,
): SurroundingDarkMesh => {
    const geometry = new THREE.PlaneGeometry(width, height);

    const material = new THREE.MeshBasicNodeMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    material.colorNode = TSL.Fn(() => {
        const uvCoord = TSL.uv();
        const center = TSL.vec2(0.5, 0.5);
        const dist = TSL.distance(uvCoord, center).mul(2.0);

        // 0%→5%, 10%→10%, 54%→20%, 100%→80%
        const t1 = TSL.clamp(dist.div(0.1), 0.0, 1.0);
        const a1 = TSL.mix(0.05, 0.1, t1);
        const t2 = TSL.clamp(dist.sub(0.1).div(0.44), 0.0, 1.0);
        const a2 = TSL.mix(a1, 0.2, t2);
        const t3 = TSL.clamp(dist.sub(0.54).div(0.46), 0.0, 1.0);
        const darknessAlpha = TSL.mix(a2, 0.8, t3);

        return TSL.vec4(0.0, 0.0, 0.0, darknessAlpha);
    })();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.position.set(0, 0, 9999);

    return {
        mesh,
    };
};

export const disposeEffectMesh = (
    scene: THREE.Scene,
    effectMesh: { mesh: THREE.Mesh },
) => {
    scene.remove(effectMesh.mesh);
    effectMesh.mesh.geometry.dispose();
    const material = effectMesh.mesh.material as THREE.MeshBasicNodeMaterial;
    material.dispose();
};
