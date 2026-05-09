/* eslint-disable */

import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';

// ============================================================
// Constants
// ============================================================
const EFFECT_Z = 10000;

// ============================================================
// Types
// ============================================================
export type EffectMesh = {
    mesh: THREE.Mesh;
    uniforms: {
        time: THREE.UniformNode<'float', number>;
        intensity: THREE.UniformNode<'float', number>;
        speed: THREE.UniformNode<'float', number>;
    };
};

export type SnowEffectMesh = {
    mesh: THREE.Mesh;
    uniforms: {
        time: THREE.UniformNode<'float', number>;
        intensity: THREE.UniformNode<'float', number>;
        speed: THREE.UniformNode<'float', number>;
        depth: THREE.UniformNode<'float', number>;
    };
};

export type FlareEffectMesh = {
    mesh: THREE.Mesh;
    uniforms: {
        time: THREE.UniformNode<'float', number>;
        intensity: THREE.UniformNode<'float', number>;
        speed: THREE.UniformNode<'float', number>;
        type: THREE.UniformNode<'float', number>;
    };
};

export type AllEffectMeshes = {
    rain: EffectMesh;
    storm: EffectMesh;
    srain: EffectMesh;
    fire: EffectMesh;
    lightning: EffectMesh;
    arc: EffectMesh;
    snow: SnowEffectMesh;
    blizzard: EffectMesh;
    crystal: EffectMesh;
    embers: EffectMesh;
    fireworks: EffectMesh;
    bokeh: EffectMesh;
    heartbeat: EffectMesh;
    intoyou: EffectMesh;
    stars: EffectMesh;
    nebula: EffectMesh;
    flare: FlareEffectMesh;
    laser: EffectMesh;
    pulse: EffectMesh;
    fog: EffectMesh;
    vfog: EffectMesh;
    cloud: EffectMesh;
    sandy: EffectMesh;
    ocean: EffectMesh;
    caustic: EffectMesh;
    bonfire: EffectMesh;
    blaze: EffectMesh;
    vhs: EffectMesh;
};

// ============================================================
// TSL Helper Factories
// Each returns a new TSL.Fn to be used inside a colorNode.
// ============================================================

/** vec2 hash(vec2) -> [-1,1] (gradient noise) */
function tslHash22() {
    return TSL.Fn(([p_immutable]: [THREE.Node<'vec2'>]) => {
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
            TSL.vec2(2.0).mul(TSL.vec2(TSL.fract(sinP.x), TSL.fract(sinP.y))),
        );
    });
}

/** float rand(vec2) -> [0,1] simple hash */
function tslRand() {
    return TSL.Fn(([co]: [THREE.Node<'vec2'>]) => {
        return TSL.fract(
            TSL.sin(TSL.dot(co, TSL.vec2(12.9898, 78.233))).mul(43758.5453),
        );
    });
}

/** Simplex-like 2D noise -> ~[-1,1] */
function tslNoise2D() {
    const hash22 = tslHash22();
    return TSL.Fn(([p_immutable]: [THREE.Node<'vec2'>]) => {
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
}

/** Value noise for fire shader: float noise(vec2, float frequency) */
function tslValueNoise() {
    const rand = tslRand();
    return TSL.Fn(([co, freq]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
        const v = TSL.vec2(co).mul(freq).toVar();
        const ix1 = TSL.floor(v.x);
        const iy1 = TSL.floor(v.y);
        const ix2 = TSL.floor(v.x.add(1.0));
        const iy2 = TSL.floor(v.y.add(1.0));
        const fx = TSL.fract(v.x).toVar();
        const fy = TSL.fract(v.y).toVar();
        // hermite interpolation
        fx.assign(fx.mul(fx).mul(TSL.float(3.0).sub(fx.mul(2.0))));
        fy.assign(fy.mul(fy).mul(TSL.float(3.0).sub(fy.mul(2.0))));
        const fade1 = TSL.mix(
            rand(TSL.vec2(ix1, iy1)),
            rand(TSL.vec2(ix2, iy1)),
            fx,
        );
        const fade2 = TSL.mix(
            rand(TSL.vec2(ix1, iy2)),
            rand(TSL.vec2(ix2, iy2)),
            fx,
        );
        return TSL.mix(fade1, fade2, fy);
    });
}

// ============================================================
// Mesh creation helper
// ============================================================
function createEffectGeometryAndMaterial(width: number, height: number) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicNodeMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    return { geometry, material };
}

function finalizeEffectMesh(
    geometry: THREE.PlaneGeometry,
    material: THREE.MeshBasicNodeMaterial,
) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.position.set(0, 0, EFFECT_Z);
    return mesh;
}

function createBaseUniforms() {
    return {
        time: TSL.uniform(0.0),
        intensity: TSL.uniform(0.8),
        speed: TSL.uniform(1.0),
    };
}

// ============================================================
// 1. Rain — 雨滴玻璃效果 (faithful port from GLSL)
// ============================================================
export const createRainEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // --- TSL helpers matching original GLSL ---

    // N13: float -> vec3 (3-component hash)
    const N13 = TSL.Fn(([p]: [THREE.Node<'float'>]) => {
        const p3 = TSL.fract(
            TSL.vec3(p, p, p).mul(TSL.vec3(0.1031, 0.11369, 0.13787)),
        ).toVar();
        p3.addAssign(TSL.dot(p3, TSL.vec3(p3.y, p3.z, p3.x).add(19.19)));
        return TSL.fract(
            TSL.vec3(
                p3.x.add(p3.y).mul(p3.z),
                p3.x.add(p3.z).mul(p3.y),
                p3.y.add(p3.z).mul(p3.x),
            ),
        );
    });

    // N: float -> float (simple hash)
    const N_hash = TSL.Fn(([t]: [THREE.Node<'float'>]) =>
        TSL.fract(TSL.sin(TSL.float(t).mul(12345.564)).mul(7658.76)),
    );

    // Saw: sawtooth-like envelope
    const Saw = TSL.Fn(([b, t]: [THREE.Node<'float'>, THREE.Node<'float'>]) =>
        TSL.smoothstep(0.0, b, t).mul(TSL.smoothstep(1.0, b, t)),
    );

    // DropLayer2: vec2, float -> vec2(mainDrop+droplets, trail)
    const DropLayer2 = TSL.Fn(
        ([uvIn, tIn]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const UV = TSL.vec2(uvIn).toVar();
            const uv = TSL.vec2(uvIn).toVar();
            // uv.y += t * 0.75
            uv.assign(TSL.vec2(uv.x, uv.y.add(TSL.float(tIn).mul(0.75))));

            // Fewer cells = fewer drops
            const grid = TSL.vec2(6.0, 3.0);
            const id = TSL.floor(uv.mul(grid)).toVar();

            // Column shift
            const colShift = N_hash(id.x);
            uv.assign(TSL.vec2(uv.x, uv.y.add(colShift)));
            id.assign(TSL.floor(uv.mul(grid)));

            const n = N13(id.x.mul(35.2).add(id.y.mul(2376.1)));
            // st = fract(uv*grid) - vec2(0.5, 0.0)
            const st = TSL.fract(uv.mul(grid)).sub(TSL.vec2(0.5, 0.0)).toVar();

            // Drop x position with per-drop randomized wiggle
            const x = n.x.sub(0.5).toVar();
            const yWiggle = UV.y.mul(TSL.float(15.0).add(n.y.mul(10.0)));
            const wiggle = TSL.sin(yWiggle.add(TSL.sin(yWiggle)));
            x.addAssign(
                wiggle.mul(TSL.float(0.5).sub(TSL.abs(x))).mul(n.z.sub(0.5)),
            );
            // Per-drop horizontal drift
            x.addAssign(
                TSL.sin(TSL.float(tIn).mul(n.y.mul(2.0).add(0.5))).mul(0.03),
            );
            x.mulAssign(0.4);

            // Drop y position (animated saw wave with per-drop random speed)
            const fallSpeed = n.y.mul(0.4).add(0.6);
            const ti = TSL.fract(TSL.float(tIn).mul(fallSpeed).add(n.z));
            const y = Saw(TSL.float(0.85), ti)
                .sub(0.5)
                .mul(0.9)
                .add(0.5)
                .toVar();

            // Main drop — distance with anisotropic scaling to make drops round
            // Grid is 8×4, so cell aspect = (1/8)/(1/4) = 1/2, scale y by 2 to compensate
            const p = TSL.vec2(x, y);
            const d = TSL.length(st.sub(p).mul(TSL.vec2(1.0, 2.0)));
            const mainDrop = TSL.smoothstep(0.3, 0.0, d);

            // Fade out near cell edges to prevent hard clipping
            const edgeFade = TSL.smoothstep(0.5, 0.4, TSL.abs(st.x));

            // Trail behind the drop
            const r = TSL.sqrt(TSL.smoothstep(1.0, y, st.y)).toVar();
            const cd = TSL.abs(st.x.sub(x));
            const trail = TSL.smoothstep(
                TSL.float(0.18).mul(r),
                TSL.float(0.12).mul(r).mul(r),
                cd,
            ).toVar();
            const trailFront = TSL.smoothstep(-0.02, 0.02, st.y.sub(y)).toVar();
            trail.mulAssign(trailFront.mul(r).mul(r).mul(edgeFade));

            // Small trailing droplets with randomized spacing
            const dropletFreq = TSL.float(7.0).add(n.y.mul(6.0));
            const yDrop = TSL.fract(UV.y.mul(dropletFreq)).add(st.y.sub(0.5));
            const dd = TSL.length(st.sub(TSL.vec2(x, yDrop)));
            const droplets = TSL.smoothstep(0.2, 0.0, dd);

            const m = mainDrop
                .add(droplets.mul(r).mul(trailFront))
                .mul(edgeFade);
            return TSL.vec2(m, trail);
        },
    );

    // StaticDrops: small persistent drops on the glass
    const StaticDrops = TSL.Fn(
        ([uvIn, tIn]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const uv = TSL.vec2(uvIn).mul(16.0).toVar();
            const id = TSL.floor(uv);
            uv.assign(TSL.fract(uv).sub(0.5));
            const n = N13(id.x.mul(107.45).add(id.y.mul(3543.654)));
            const p = TSL.vec2(n.x, n.y).sub(0.5).mul(0.5);
            const d = TSL.length(uv.sub(p));
            const fade = Saw(
                TSL.float(0.025),
                TSL.fract(TSL.float(tIn).add(n.z)),
            );
            return TSL.smoothstep(0.3, 0.0, d)
                .mul(TSL.fract(n.z.mul(10.0)))
                .mul(fade);
        },
    );

    // Drops: combines static drops + 2 parallax moving layers
    const Drops = TSL.Fn(
        ([uvIn, tIn, l0, l1, l2]: [
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            const s = StaticDrops(uvIn, tIn).mul(l0);
            const m1 = DropLayer2(uvIn, tIn).mul(l1).toVar();
            const m2 = DropLayer2(TSL.vec2(uvIn).mul(1.85), tIn)
                .mul(l2)
                .toVar();
            const c = TSL.smoothstep(0.3, 1.0, s.add(m1.x).add(m2.x));
            return TSL.vec2(c, TSL.max(m1.y.mul(l0), m2.y.mul(l1)));
        },
    );

    material.colorNode = TSL.Fn(() => {
        const rawUV = TSL.uv();
        // Centered, aspect-correct UV matching original GLSL
        const uv = TSL.vec2(
            rawUV.x.sub(0.5).mul(aspect),
            rawUV.y.sub(0.5),
        ).toVar();

        const T = uniforms.time.mul(uniforms.speed);
        const t = T.mul(0.2);

        // Reduced rain amount for fewer drops
        const staticDropsL = TSL.float(1.0);
        const layer1 = TSL.float(0.6);
        const layer2 = TSL.float(0.5);

        const c = Drops(uv, t, staticDropsL, layer1, layer2).toVar();

        // Normal via finite differences (for rim lighting)
        const e = TSL.float(0.005);
        const cx = Drops(
            TSL.vec2(uv.x.add(e), uv.y),
            t,
            staticDropsL,
            layer1,
            layer2,
        ).x;
        const cy = Drops(
            TSL.vec2(uv.x, uv.y.add(e)),
            t,
            staticDropsL,
            layer1,
            layer2,
        ).x;
        const n = TSL.vec2(cx.sub(c.x), cy.sub(c.x));

        // === Compositing ===
        const drop = TSL.smoothstep(0.0, 0.4, c.x);
        const trail = c.y;
        const edge = TSL.clamp(TSL.length(n).mul(40.0), 0.0, 1.0);

        // 1) Fog layer — semi-transparent darkening for wet glass
        const fogAlpha = TSL.float(0.22);
        const clearFog = drop.mul(0.95).add(trail.mul(0.6));
        const alpha = fogAlpha.mul(TSL.float(1.0).sub(clearFog)).toVar();

        // 2) Rim light — bright edges from refraction
        const rimLight = edge.mul(0.75);
        alpha.addAssign(rimLight);

        // 3) Body glow — water bead refraction
        const bodyGlow = drop.mul(0.3);
        alpha.addAssign(bodyGlow);

        // 4) Trail glow
        const trailGlow = trail.mul(0.08);
        alpha.addAssign(trailGlow);

        // 5) Lightning flash
        const lt = T.add(3.0).mul(0.5);
        const lightning = TSL.max(
            TSL.float(0.0),
            TSL.sin(lt.mul(TSL.sin(lt.mul(10.0)))).mul(
                TSL.pow(
                    TSL.max(TSL.float(0.0), TSL.sin(lt.add(TSL.sin(lt)))),
                    10.0,
                ),
            ),
        );
        alpha.addAssign(lightning.mul(0.15));

        alpha.assign(TSL.clamp(alpha, 0.0, 0.85));

        // Color compositing
        const col = TSL.vec3(0.0).toVar();
        col.addAssign(TSL.vec3(0.85, 0.9, 1.0).mul(rimLight));
        col.addAssign(TSL.vec3(0.7, 0.75, 0.9).mul(bodyGlow));
        col.addAssign(TSL.vec3(0.4, 0.45, 0.55).mul(trailGlow));
        col.addAssign(TSL.vec3(0.8, 0.85, 0.95).mul(lightning.mul(0.15)));

        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 2. Storm — 暴风雨 (faithful port from GLSL)
// ============================================================
export const createStormEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    // --- Storm-specific hash/noise matching GLSL exactly ---
    const sHash = TSL.Fn(([x]: [THREE.Node<'float'>]) =>
        TSL.fract(TSL.sin(x).mul(71523.5413)),
    );

    const sHash2 = TSL.Fn(([x]: [THREE.Node<'vec2'>]) =>
        TSL.fract(
            TSL.sin(TSL.dot(x, TSL.vec2(13.425, 15.513))).mul(71523.5413),
        ),
    );

    const sNoise = TSL.Fn(([x_immutable]: [THREE.Node<'vec2'>]) => {
        const x = TSL.vec2(x_immutable).toVar();
        const i = TSL.floor(x);
        const f = x.sub(i).toVar();
        f.assign(f.mul(f).mul(f.mul(-2.0).add(3.0)));
        return TSL.mix(
            TSL.mix(sHash2(i), sHash2(i.add(TSL.vec2(1.0, 0.0))), f.x),
            TSL.mix(
                sHash2(i.add(TSL.vec2(0.0, 1.0))),
                sHash2(i.add(TSL.vec2(1.0, 1.0))),
                f.x,
            ),
            f.y,
        );
    });

    const sFbm = TSL.Fn(([x_immutable]: [THREE.Node<'vec2'>]) => {
        const x = TSL.vec2(x_immutable).toVar();
        const r = TSL.float(0.0).toVar();
        const s = TSL.float(1.0).toVar();
        const w = TSL.float(1.0).toVar();
        TSL.Loop(5, () => {
            s.mulAssign(2.0);
            w.mulAssign(0.5);
            r.addAssign(w.mul(sNoise(x.mul(s))));
        });
        return r;
    });

    // cloud(uv, sx, sy, density, sharpness, speed, time)
    const sCloud = TSL.Fn(
        ([uvIn, sx, sy, density, sharpness, speed, time]: [
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            const v = sFbm(
                TSL.vec2(sx, sy).mul(uvIn.add(TSL.vec2(speed, 0.0).mul(time))),
            ).sub(TSL.float(1.0).sub(density));
            return TSL.pow(
                TSL.clamp(v, 0.0, 1.0),
                TSL.float(1.0).sub(sharpness),
            );
        },
    );

    // rainStreak(q, seed, time) — vertical streaks via heavily-stretched noise
    const sRainStreak = TSL.Fn(
        ([q, seed, time]: [
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            // x scaled a lot (4+), y barely (0.04) → vertical streaks
            const st = q
                .mul(TSL.vec2(TSL.float(4.0).add(seed.mul(0.5)), 0.04))
                .add(
                    TSL.vec2(
                        time.negate().mul(0.08).add(q.y.mul(0.12)),
                        time.mul(TSL.float(0.06).add(seed.mul(0.015))),
                    ),
                );
            // Multi-layer high-freq noise
            const n = sNoise(st.mul(200.0).add(seed.mul(77.0))).add(
                sNoise(st.mul(340.0).add(seed.mul(33.0))),
            );
            // High power → thin lines
            const streak = TSL.clamp(
                TSL.pow(TSL.abs(n).mul(0.5), 18.0).mul(30.0),
                0.0,
                1.0,
            ).toVar();
            // Bottom fade
            streak.mulAssign(
                TSL.smoothstep(0.0, 0.15, q.y).mul(q.y.mul(0.5).add(0.3)),
            );
            return streak;
        },
    );

    material.colorNode = TSL.Fn(() => {
        const q = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // === 1. Clouds ===
        const c1 = sCloud(
            q,
            TSL.float(4.0),
            TSL.float(10.0),
            TSL.float(1.9),
            TSL.float(0.95),
            TSL.float(0.05),
            t,
        );
        const c2 = sCloud(
            q,
            TSL.float(2.0),
            TSL.float(2.0),
            TSL.float(0.5),
            TSL.float(0.15),
            TSL.float(0.025),
            t,
        );
        const clouds = TSL.float(0.7).mul(c1).mul(c2).mul(q.y).toVar();
        // Low cloud band (gaussian)
        const cpos = q.y.sub(0.2);
        const cloudBand = TSL.exp(TSL.float(-10.0).mul(cpos).mul(cpos));
        clouds.addAssign(
            TSL.float(0.8)
                .mul(
                    sCloud(
                        q,
                        TSL.float(2.0),
                        TSL.float(2.5),
                        TSL.float(0.5),
                        TSL.float(0.15),
                        TSL.float(0.01),
                        t,
                    ),
                )
                .mul(cloudBand),
        );

        // === 2. Rain streaks (3 layers) ===
        const rain = TSL.float(0.0).toVar();
        rain.addAssign(sRainStreak(q, TSL.float(0.0), t));
        rain.addAssign(sRainStreak(q, TSL.float(1.0), t).mul(0.7));
        rain.addAssign(sRainStreak(q, TSL.float(2.0), t).mul(0.5));

        // === 3. Lightning ===
        const lt = TSL.floor(TSL.float(3.0).mul(t));
        const lightning = TSL.float(0.0).toVar();
        TSL.If(sHash(lt.add(7.7)).greaterThan(0.82), () => {
            const phase = TSL.fract(TSL.float(3.0).mul(t));
            lightning.assign(TSL.pow(TSL.float(1.0).sub(phase), 12.0).mul(0.6));
        });

        // === 4. Compositing ===
        const col = TSL.vec3(0.0).toVar();
        const alpha = TSL.float(0.12).toVar(); // overcast

        // Clouds
        col.addAssign(TSL.vec3(0.75, 0.78, 0.82).mul(clouds));
        alpha.addAssign(clouds.mul(0.35));

        // Rain
        col.addAssign(TSL.vec3(0.6, 0.65, 0.72).mul(rain));
        alpha.addAssign(rain.mul(0.5));

        // Lightning
        col.addAssign(TSL.vec3(0.75, 0.8, 0.95).mul(lightning));
        alpha.addAssign(lightning);

        alpha.assign(TSL.clamp(alpha, 0.0, 0.65));
        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 3. SlantRain — 斜雨 (faithful port from GLSL)
// ============================================================
export const createSlantRainEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    const srHash = TSL.Fn(([n]: [THREE.Node<'float'>]) =>
        TSL.fract(TSL.sin(n.mul(127.1)).mul(43758.5453)),
    );

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);
        const totalVal = TSL.float(0.0).toVar();

        // Slant angle: ~25 degrees (tan25 ≈ 0.47)
        const slant = TSL.float(0.47);

        // 3 layers for depth variation
        TSL.Loop(3, ({ i }) => {
            const lf = TSL.float(i);
            const speed = TSL.float(0.6).add(lf.mul(0.25));
            const colCount = TSL.float(45.0).add(lf.mul(20.0));
            const bright = TSL.float(0.16).sub(lf.mul(0.04));
            const dropLen = TSL.float(0.1).sub(lf.mul(0.015));
            const lineW = TSL.float(0.0018).sub(lf.mul(0.0003));

            // Shear coordinates: map diagonal rain columns to vertical
            const sx = uv.x.mul(aspect).sub(uv.y.mul(slant)).toVar();
            const totalW = TSL.float(aspect).add(slant);
            const colW = totalW.div(colCount);
            const colIdx = TSL.floor(sx.div(colW));

            // Check current column and neighbors
            TSL.Loop(3, ({ i: dcIdx }) => {
                const dc = TSL.float(dcIdx).sub(1.0); // -1, 0, 1
                const ci = colIdx.add(dc);

                // 3 drops per column
                TSL.Loop(3, ({ i: dIdx }) => {
                    const d = TSL.float(dIdx);
                    const seed = ci
                        .mul(7.31)
                        .add(d.mul(997.1))
                        .add(lf.mul(3001.7));
                    const r1 = srHash(seed);
                    const r2 = srHash(seed.add(0.37));

                    const dSpeed = speed.mul(TSL.float(0.6).add(r2.mul(0.8)));
                    // Head position (falling from top)
                    const headY = TSL.fract(
                        r1.mul(13.7).add(d.mul(2.31)).sub(t.mul(dSpeed)),
                    );

                    // Drop x center in shear space
                    const dropSX = ci.add(0.3).add(r1.mul(0.4)).mul(colW);
                    const dx = TSL.abs(sx.sub(dropSX));

                    // Distance from head along y axis
                    const dy = uv.y.sub(headY);

                    // Drop: head at headY, tail at headY+dropLen (above)
                    // TSL has no if(a && b), use smoothstep masks instead
                    const inDrop = TSL.smoothstep(0.0, 0.001, dy).mul(
                        TSL.smoothstep(dropLen, dropLen.sub(0.001), dy),
                    );
                    const fade = TSL.float(1.0).sub(dy.div(dropLen));
                    const profile = TSL.exp(
                        dx.mul(dx).negate().div(lineW.mul(lineW)),
                    );
                    totalVal.addAssign(
                        bright.mul(fade).mul(fade).mul(profile).mul(inDrop),
                    );
                });
            });
        });

        // Constant bright-white rain color, alpha controls visibility
        const col = TSL.vec3(0.85, 0.9, 0.97);
        const alpha = TSL.clamp(totalVal.mul(2.5), 0.0, 0.55);
        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 4. Fire — 火焰
// ============================================================
export const createFireEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);
        const valueNoise = tslValueNoise();

        const gradient = TSL.float(1.0).sub(uv.y);
        const gradientStep = TSL.float(0.2);

        // Animated noise position
        const pos = TSL.vec2(uv.x, uv.y.sub(t.mul(0.3125))).toVar();

        // Multi-octave Perlin noise (5 octaves)
        const noiseVal = TSL.float(0.0).toVar();
        const nAmpl = TSL.float(1.0).toVar();
        const nSum = TSL.float(0.0).toVar();
        const nFreq = TSL.float(10.0).toVar();
        TSL.Loop(5, () => {
            nSum.addAssign(nAmpl);
            noiseVal.addAssign(valueNoise(pos, nFreq).mul(nAmpl));
            nFreq.mulAssign(2.0);
            nAmpl.mulAssign(0.5);
        });
        noiseVal.divAssign(nSum);

        const brighterColor = TSL.vec4(1.0, 0.65, 0.1, 0.25);
        const darkerColor = TSL.vec4(1.0, 0.0, 0.15, 0.0625);
        const middleColor = TSL.mix(brighterColor, darkerColor, 0.5);

        const firstStep = TSL.smoothstep(0.0, noiseVal, gradient);
        const darkerColorStep = TSL.smoothstep(
            0.0,
            noiseVal,
            gradient.sub(gradientStep),
        );
        const darkerColorPath = firstStep.sub(darkerColorStep);
        const color = TSL.mix(
            brighterColor,
            darkerColor,
            darkerColorPath,
        ).toVar();

        const middleColorStep = TSL.smoothstep(
            0.0,
            noiseVal,
            gradient.sub(0.4),
        );
        color.assign(
            TSL.mix(color, middleColor, darkerColorStep.sub(middleColorStep)),
        );
        color.assign(TSL.mix(TSL.vec4(0.0), color, firstStep));

        // Use brightness as alpha
        const fireAlpha = TSL.max(color.x, TSL.max(color.y, color.z));
        const clampedAlpha = TSL.clamp(fireAlpha.mul(1.2), 0.0, 0.92);

        return TSL.vec4(
            color.x,
            color.y,
            color.z,
            clampedAlpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 5. Lightning — 闪电
// ============================================================
export const createLightningEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);
        const rand = tslRand();
        const alpha = TSL.float(0.0).toVar();

        // Phase cycling: each bolt lasts ~1.5 seconds
        const phase = TSL.fract(t.mul(0.67));
        const seed = TSL.floor(t.mul(0.67));

        // Bolt visibility (15% grow, 35% glow, 30% fade, 20% off)
        const boltAlpha = TSL.smoothstep(0.0, 0.15, phase).mul(
            TSL.smoothstep(0.8, 0.5, phase),
        );

        // Main bolt path
        const boltX = TSL.float(0.5).toVar();
        const segments = 20;
        TSL.Loop(segments, ({ i }) => {
            const segY = TSL.float(i).div(segments);
            const segYnext = TSL.float(i).add(1.0).div(segments);
            // Noise-based horizontal offset
            const offset = rand(TSL.vec2(seed, TSL.float(i).mul(7.13)))
                .sub(0.5)
                .mul(0.12);
            boltX.addAssign(offset);

            // Check if current UV.y is in this segment
            TSL.If(uv.y.greaterThan(segY).and(uv.y.lessThan(segYnext)), () => {
                const segFract = uv.y.sub(segY).div(segYnext.sub(segY));
                const localX = TSL.mix(boltX.sub(offset), boltX, segFract);

                // Distance from bolt center
                const dist = TSL.abs(uv.x.sub(localX));
                // Core glow
                const core = TSL.smoothstep(0.008, 0.0, dist);
                // Outer glow
                const glow = TSL.smoothstep(0.06, 0.0, dist).mul(0.4);
                alpha.addAssign(core.add(glow).mul(boltAlpha));
            });
        });

        alpha.assign(TSL.clamp(alpha, 0.0, 1.0));
        const c = TSL.mix(TSL.vec3(0.6, 0.7, 1.0), TSL.vec3(1.0), alpha);
        return TSL.vec4(c.x, c.y, c.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 6. Arc — 电弧 (faithful port from GLSL, FBM lightning by jjxtra)
// ============================================================
export const createArcEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // ARC_AA(v) = abs(fract(v) - 0.5)  — inlined for both float & vec2

    const lightningNoise = TSL.Fn(
        ([detailPos, detailPos2, shapePosIn]: [
            THREE.Node<'vec2'>,
            THREE.Node<'vec2'>,
            THREE.Node<'vec2'>,
        ]) => {
            const offsetScalar = 0.91;
            const offsetScalar2 = 0.213;
            const t = uniforms.time.mul(uniforms.speed).mul(4.0);
            const t2 = t.mul(1.64658);

            // detail #1 noise offset
            const noiseXY = TSL.abs(
                TSL.fract(detailPos.add(t)).sub(0.5),
            ).toVar();
            const noiseZ = TSL.abs(
                TSL.fract(detailPos.y.sub(t2).add(noiseXY.x)).sub(0.5),
            ).toVar();
            const offset = TSL.vec2(noiseZ, noiseXY.x.add(noiseXY.y)).toVar();
            const sp = shapePosIn.add(offset.mul(offsetScalar)).toVar();

            // detail #2 noise offset
            noiseXY.assign(TSL.abs(TSL.fract(detailPos2.sub(t2)).sub(0.5)));
            noiseZ.assign(
                TSL.abs(
                    TSL.fract(detailPos2.y.sub(t2).add(noiseXY.y)).sub(0.5),
                ),
            );
            offset.assign(TSL.vec2(noiseXY.x.add(noiseXY.y), noiseZ));
            sp.addAssign(offset.mul(offsetScalar2));

            // shape noise
            const innerAA = TSL.abs(TSL.fract(sp.y).sub(0.5));
            noiseZ.assign(TSL.abs(TSL.fract(sp.x.add(innerAA)).sub(0.5)));
            return noiseZ;
        },
    );

    const lightningNoiseFBM = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const pScaled = pIn.mul(0.15);
        const detailPos = pScaled.toVar();
        const detailPos2 = pScaled.toVar();
        const shapePos = pScaled.toVar();
        const amplitude = TSL.float(0.8).toVar();
        const noise = TSL.float(0.0).toVar();

        TSL.Loop(5, () => {
            detailPos.mulAssign(0.46213);
            detailPos2.mulAssign(1.96213);
            shapePos.mulAssign(1.06213);
            noise.addAssign(
                lightningNoise(detailPos, detailPos2, shapePos).mul(amplitude),
            );
            amplitude.mulAssign(0.3);
        });

        return TSL.min(
            TSL.float(1.0),
            TSL.float(10.0).mul(TSL.pow(noise, 4.0)),
        );
    });

    material.colorNode = TSL.Fn(() => {
        // UVSCALE = 8.0
        const uv = TSL.uv().mul(8.0);
        const p = uv.mul(2.0).sub(1.0).mul(TSL.vec2(aspect, 1.0));

        const noise = lightningNoiseFBM(p);
        const col = TSL.mix(
            TSL.vec3(0.2, 0.2, 0.8),
            TSL.vec3(1.0, 1.0, 1.0),
            noise,
        )
            .mul(noise)
            .toVar();

        // alpha from brightness
        const brightness = TSL.max(col.x, TSL.max(col.y, col.z));
        const alpha = TSL.clamp(brightness.mul(2.0), 0.0, 0.9);

        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 7. Snow — 飘雪 (faithful port from GLSL: Andrew Baldwin "Just snow")
// 50 parallax layers, mat3 hash, depth-of-field
// ============================================================
export const createSnowEffectMesh = (
    width: number,
    height: number,
): SnowEffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const baseUniforms = createBaseUniforms();
    const depthUniform = TSL.uniform(0.5);
    const aspectY = height / width;

    const LAYERS = 50;
    const DEPTH = 0.5;
    const WIDTH = 0.3;
    const SPEED = 0.6;

    // mat3 p (GLSL column-major) rows for p * vec3:
    // row0: (13.323122, 23.5112, 21.71123)
    // row1: (21.1212, 28.7312, 11.9312)
    // row2: (21.8112, 14.7212, 61.3934)

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = baseUniforms.time.mul(baseUniforms.speed);

        // uv = vec2(1.0, iResolution.y / iResolution.x) * v_uv
        const uv = TSL.vec2(rawUv.x, rawUv.y.mul(aspectY));
        const acc = TSL.float(0.0).toVar();
        const dof = TSL.float(5.0).mul(TSL.sin(t.mul(0.1)));

        TSL.Loop(LAYERS, ({ i }) => {
            const fi = TSL.float(i);

            // q = uv * (1.0 + fi * DEPTH)
            const q = uv.mul(TSL.float(1.0).add(fi.mul(DEPTH))).toVar();

            // q += vec2(q.y*(WIDTH*mod(fi*7.238917,1.0)-WIDTH*0.5), SPEED*iTime/(1+fi*DEPTH*0.03))
            const windOffset = q.y.mul(
                TSL.float(WIDTH)
                    .mul(TSL.mod(fi.mul(7.238917), 1.0))
                    .sub(WIDTH * 0.5),
            );
            const fallOffset = TSL.float(SPEED)
                .mul(t)
                .div(TSL.float(1.0).add(fi.mul(DEPTH * 0.03)));
            q.addAssign(TSL.vec2(windOffset, fallOffset));

            // n = vec3(floor(q), 31.189 + fi)
            const flQ = TSL.floor(q);
            const nz = TSL.float(31.189).add(fi);

            // mm = floor(n)*0.00001 + fract(n)
            const mmx = flQ.x.mul(0.00001);
            const mmy = flQ.y.mul(0.00001);
            const mmz = TSL.floor(nz).mul(0.00001).add(TSL.fract(nz));

            // p * mm (mat3-vec3 multiply, 3 dot products)
            const pmm0 = TSL.float(13.323122)
                .mul(mmx)
                .add(TSL.float(23.5112).mul(mmy))
                .add(TSL.float(21.71123).mul(mmz));
            const pmm1 = TSL.float(21.1212)
                .mul(mmx)
                .add(TSL.float(28.7312).mul(mmy))
                .add(TSL.float(11.9312).mul(mmz));
            // const pmm2 = TSL.float(21.8112)
            //     .mul(mmx)
            //     .add(TSL.float(14.7212).mul(mmy))
            //     .add(TSL.float(61.3934).mul(mmz));

            // mp = (31415.9 + mm) / fract(p * mm)
            const mpx = TSL.float(31415.9).add(mmx).div(TSL.fract(pmm0));
            const mpy = TSL.float(31415.9).add(mmy).div(TSL.fract(pmm1));
            // const mpz = TSL.float(31415.9).add(mmz).div(TSL.fract(pmm2));

            // r = fract(mp)
            const rx = TSL.fract(mpx);
            const ry = TSL.fract(mpy);

            // s = abs(mod(q, 1.0) - 0.5 + 0.9 * r.xy - 0.45)
            const fqx = TSL.fract(q.x);
            const fqy = TSL.fract(q.y);
            const sx = TSL.abs(
                fqx.sub(0.5).add(TSL.float(0.9).mul(rx)).sub(0.45),
            );
            const sy = TSL.abs(
                fqy.sub(0.5).add(TSL.float(0.9).mul(ry)).sub(0.45),
            );

            // s += 0.01 * abs(2.0 * fract(10.0 * q.yx) - 1.0)
            const sx2 = sx.add(
                TSL.float(0.01).mul(
                    TSL.abs(
                        TSL.float(2.0)
                            .mul(TSL.fract(TSL.float(10.0).mul(q.y)))
                            .sub(1.0),
                    ),
                ),
            );
            const sy2 = sy.add(
                TSL.float(0.01).mul(
                    TSL.abs(
                        TSL.float(2.0)
                            .mul(TSL.fract(TSL.float(10.0).mul(q.x)))
                            .sub(1.0),
                    ),
                ),
            );

            // d = 0.6 * max(s.x - s.y, s.x + s.y) + max(s.x, s.y) - 0.01
            const d = TSL.float(0.6)
                .mul(TSL.max(sx2.sub(sy2), sx2.add(sy2)))
                .add(TSL.max(sx2, sy2))
                .sub(0.01);

            // edge = 0.005 + 0.05 * min(0.5 * abs(fi - 5.0 - dof), 1.0)
            const edge = TSL.float(0.005).add(
                TSL.float(0.05).mul(
                    TSL.min(
                        TSL.float(0.5).mul(TSL.abs(fi.sub(5.0).sub(dof))),
                        1.0,
                    ),
                ),
            );

            // acc += smoothstep(edge, -edge, d) * (r.x / (1.0 + 0.02 * fi * DEPTH))
            const flake = TSL.smoothstep(edge, edge.negate(), d).mul(
                rx.div(TSL.float(1.0).add(TSL.float(0.02).mul(fi).mul(DEPTH))),
            );
            acc.addAssign(flake);
        });

        // brightness = pow(max(acc, 0), 0.7) * 1.4
        const brightness = TSL.clamp(
            TSL.pow(TSL.max(acc, 0.0), 0.7).mul(1.4),
            0.0,
            1.0,
        );
        const alpha = TSL.clamp(brightness.mul(1.1), 0.0, 0.95);

        return TSL.vec4(
            brightness,
            brightness,
            brightness,
            alpha.mul(baseUniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return {
        mesh,
        uniforms: { ...baseUniforms, depth: depthUniform },
    };
};

// ============================================================
// 8. Blizzard — 暴风雪
// ============================================================
export const createBlizzardEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);
        const rand = tslRand();
        const totalSnow = TSL.float(0.0).toVar();
        const blizardFactor = TSL.float(0.2);

        // 120 snowflake particles (reduced from 200 for mobile)
        const snowflakeCount = 120;
        TSL.Loop(snowflakeCount, ({ i }) => {
            const j = TSL.float(i);
            const speed = rand(TSL.vec2(TSL.cos(j), 0.0))
                .mul(0.7)
                .add(0.3);
            const centerX = uv.y
                .sub(0.25)
                .negate()
                .mul(blizardFactor)
                .add(rand(TSL.vec2(j, 0.0)))
                .add(TSL.cos(t.add(TSL.sin(j))).mul(0.1));
            const rawY = TSL.sin(j).sub(
                speed.mul(t.mul(1.5).mul(blizardFactor.add(0.1))),
            );
            const centerY = TSL.fract(rawY.add(100.0)); // mod equivalent
            const dist = TSL.length(uv.sub(TSL.vec2(centerX, centerY)));
            const radius = speed.mul(0.012).add(0.001);
            totalSnow.addAssign(TSL.smoothstep(radius, 0.0, dist).mul(0.09));
        });

        const snowAlpha = TSL.pow(TSL.clamp(totalSnow, 0.0, 1.0), 0.7).mul(1.4);
        const clampedAlpha = TSL.clamp(snowAlpha, 0.0, 1.0);
        return TSL.vec4(1.0, 1.0, 1.0, clampedAlpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 9. Crystal — 晶体雪花 (simplified for mobile)
// ============================================================
export const createCrystalEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed).mul(0.2);
        const rand = tslRand();
        const color = TSL.vec3(0.0).toVar();
        const alpha = TSL.float(0.0).toVar();

        // Simplified multi-layer snowflake crystals
        TSL.Loop(8, ({ i }) => {
            const layerIdx = TSL.float(i);
            const offset = TSL.vec2(
                rand(TSL.vec2(layerIdx, 0.0)).sub(0.5),
                rand(TSL.vec2(0.0, layerIdx)).sub(0.5).sub(t.mul(0.3)),
            );

            // 6-fold symmetry
            const p = uv.sub(0.5).sub(offset.mul(0.5)).mul(4.0).toVar();
            const angle = TSL.atan(p.y, p.x).toVar();
            const radius = TSL.length(p);

            // Map angle to 0-PI/3 range (6-fold symmetry)
            const symAngle = TSL.abs(
                TSL.fract(angle.div((Math.PI * 2.0) / 6.0).add(0.5)).sub(0.5),
            ).mul((Math.PI * 2.0) / 6.0);

            // Snowflake shape: branches + hexagonal symmetry
            const branch = TSL.cos(symAngle).mul(radius);
            const branchWidth = TSL.smoothstep(
                0.03,
                0.0,
                TSL.abs(TSL.sin(symAngle).mul(radius)).sub(0.01),
            );
            const armLength = rand(TSL.vec2(layerIdx, 1.0)).mul(0.3).add(0.2);
            const armMask = TSL.smoothstep(armLength, 0.0, branch);

            const flakeAlpha = branchWidth
                .mul(armMask)
                .mul(TSL.smoothstep(0.5, 0.0, radius));

            color.addAssign(TSL.vec3(0.8, 0.9, 1.0).mul(flakeAlpha.mul(0.15)));
            alpha.addAssign(flakeAlpha.mul(0.15));
        });

        alpha.assign(TSL.clamp(alpha, 0.0, 0.95));
        color.assign(TSL.clamp(color, 0.0, 1.0));
        return TSL.vec4(
            color.x,
            color.y,
            color.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 10. Embers — 余烬火星 (faithful port from GLSL: Jan Mróz Voronoi particles)
// ============================================================
export const createEmbersEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // Constants matching GLSL #defines
    const ANIMATION_SPEED = 1.5;
    const PARTICLE_SIZE = 0.009;
    const SIZE_MOD = 1.05;
    const ALPHA_MOD = 0.9;
    const LAYERS_COUNT = 15;
    // MOVEMENT_DIRECTION * MOVEMENT_SPEED = vec2(0.7, -1.0)
    const MD_X = 0.7;
    const MD_Y = -1.0;
    // Pre-computed: SPARK=vec3(1,0.4,0.05)*1.5, BLOOM=*0.8, SMOKE=vec3(1,0.43,0.1)*0.8

    // hash1_2(vec2) -> float
    const eHash1 = TSL.Fn(([x]: [THREE.Node<'vec2'>]) =>
        TSL.fract(TSL.sin(TSL.dot(x, TSL.vec2(127.1, 311.7))).mul(43758.5453)),
    );

    // hash2_2(vec2) -> vec2
    const eHash2 = TSL.Fn(([x]: [THREE.Node<'vec2'>]) => {
        const d1 = TSL.dot(x, TSL.vec2(127.1, 311.7));
        const d2 = TSL.dot(x, TSL.vec2(269.5, 183.3));
        return TSL.vec2(
            TSL.fract(TSL.sin(d1).mul(43758.5453)),
            TSL.fract(TSL.sin(d2).mul(43758.5453)),
        );
    });

    // noise1_2(vec2) -> float — value noise with hermite
    const eNoise1 = TSL.Fn(([p]: [THREE.Node<'vec2'>]) => {
        const ip = TSL.floor(p);
        const fp = TSL.fract(p).toVar();
        fp.assign(fp.mul(fp).mul(TSL.vec2(3.0).sub(fp.mul(2.0))));
        return TSL.mix(
            TSL.mix(eHash1(ip), eHash1(ip.add(TSL.vec2(1.0, 0.0))), fp.x),
            TSL.mix(
                eHash1(ip.add(TSL.vec2(0.0, 1.0))),
                eHash1(ip.add(TSL.vec2(1.0, 1.0))),
                fp.x,
            ),
            fp.y,
        );
    });

    // rotate(vec2, float) -> vec2: mat2(s,c,-c,s) * point
    const eRotate = TSL.Fn(
        ([pt, deg]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const s = TSL.sin(deg);
            const c = TSL.cos(deg);
            return TSL.vec2(
                s.mul(pt.x).sub(c.mul(pt.y)),
                c.mul(pt.x).add(s.mul(pt.y)),
            );
        },
    );

    // fireParticles(uv, originalUV, iTime) -> vec3
    const fireParticlesFn = TSL.Fn(
        ([uvP, origUV, iTime]: [
            THREE.Node<'vec2'>,
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
        ]) => {
            const particles = TSL.vec3(0.0).toVar();
            const rootUV = TSL.floor(uvP);
            const rh1 = eHash1(rootUV);
            const rh2f = eHash2(rootUV).sub(0.5).toVar();

            // degFromRootUV: iTime * ANIMATION_SPEED * (hash-0.5)*2
            const deg = iTime.mul(ANIMATION_SPEED).mul(rh1.sub(0.5).mul(2.0));

            // voronoiPointFromRoot: rotate(hash-0.5, deg)*0.66 + root + 0.5
            const sv = TSL.sin(deg);
            const cv = TSL.cos(deg);
            const rotPt = TSL.vec2(
                sv.mul(rh2f.x).sub(cv.mul(rh2f.y)),
                cv.mul(rh2f.x).add(sv.mul(rh2f.y)),
            ).mul(0.66);
            const pointUV = rotPt.add(rootUV).add(0.5);

            // Noise distortion: noise2_2(uv*2), noise2_2(uv*3+t)
            const n2a = TSL.vec2(
                eNoise1(uvP.mul(2.0)),
                eNoise1(uvP.mul(2.0).add(100.0)),
            );
            const n2b = TSL.vec2(
                eNoise1(uvP.mul(3.0).add(iTime)),
                eNoise1(uvP.mul(3.0).add(iTime).add(100.0)),
            );
            const tempUV = uvP
                .add(n2a.sub(0.5).mul(0.1))
                .sub(n2b.sub(0.5).mul(0.07));

            const diff = tempUV.sub(pointUV);
            const rotDiff = eRotate(diff, TSL.float(0.7));

            // Particle dist: randomAround2_2(PARTICLE_SCALE, PARTICLE_SCALE_VAR, rootUV)
            const pScale = TSL.vec2(0.5, 1.6).add(
                rh2f.mul(TSL.vec2(0.25, 0.2)),
            );
            const dist = TSL.length(rotDiff.mul(pScale));

            // Bloom dist: randomAround2_2(PARTICLE_BLOOM_SCALE, PARTICLE_BLOOM_SCALE_VAR, rootUV)
            const bScale = TSL.vec2(0.5, 0.8).add(rh2f.mul(TSL.vec2(0.3, 0.1)));
            const distBloom = TSL.length(rotDiff.mul(bScale));

            // Spark: (1-smoothstep(SIZE*0.6, SIZE*3, dist)) * SPARK_COLOR
            const sparkV = TSL.float(1.0).sub(
                TSL.smoothstep(PARTICLE_SIZE * 0.6, PARTICLE_SIZE * 3.0, dist),
            );
            particles.addAssign(TSL.vec3(1.5, 0.6, 0.075).mul(sparkV));

            // Bloom: pow(1-smoothstep(0,SIZE*6,distBloom), 3) * BLOOM_COLOR
            const bloomV = TSL.pow(
                TSL.float(1.0).sub(
                    TSL.smoothstep(0.0, PARTICLE_SIZE * 6.0, distBloom),
                ),
                3.0,
            );
            particles.addAssign(TSL.vec3(0.8, 0.32, 0.04).mul(bloomV));

            // Disappear/appear borders
            const border1 = rh1.sub(0.5).mul(2.0);
            const disappear = TSL.float(1.0).sub(
                TSL.smoothstep(border1, border1.add(0.5), origUV.y),
            );
            const border2 = eHash1(rootUV.add(0.214)).sub(1.8).mul(0.7);
            const appear = TSL.smoothstep(border2, border2.add(0.4), origUV.y);

            particles.mulAssign(disappear.mul(appear));
            return particles;
        },
    );

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // Centered UVs: (2*fragCoord - iRes) / iRes.y
        const uv = TSL.vec2(
            rawUv.x.mul(2.0).sub(1.0).mul(aspect),
            rawUv.y.mul(2.0).sub(1.0),
        ).toVar();

        // Vignette (expanded range for full-screen)
        const vignette = TSL.float(1.0).sub(
            TSL.smoothstep(0.6, 1.8, TSL.length(uv.add(TSL.vec2(0.0, 0.15)))),
        );

        uv.mulAssign(1.8);

        // ── Smoke: layeredNoise1_2(uv*10+t*4*MD, 1.7, 0.7, 6, 0.2) ──
        const smokeUV = uv
            .mul(10.0)
            .add(TSL.vec2(t.mul(4.0 * MD_X), t.mul(4.0 * MD_Y)));
        const smokeN = TSL.float(0.0).toVar();
        const sAlpha = TSL.float(1.0).toVar();
        const sSize = TSL.float(1.0).toVar();
        const sOff = TSL.vec2(0.0, 0.0).toVar();
        TSL.Loop(6, () => {
            sOff.addAssign(eHash2(TSL.vec2(sAlpha, sSize)).mul(10.0));
            smokeN.addAssign(
                eNoise1(
                    smokeUV
                        .mul(sSize)
                        .add(TSL.vec2(t.mul(1.12), t.mul(-1.6)))
                        .add(sOff),
                ).mul(sAlpha),
            );
            sAlpha.mulAssign(0.7);
            sSize.mulAssign(1.7);
        });
        smokeN.mulAssign((1 - 0.7) / (1 - Math.pow(0.7, 6)));

        // smokeIntensity *= pow(1 - smoothstep(-1.5, 2.5, uv.y), 2)
        const smokeIntensity = smokeN.mul(
            TSL.pow(TSL.float(1.0).sub(TSL.smoothstep(-1.5, 2.5, uv.y)), 2.0),
        );

        // smoke = smokeIntensity * SMOKE_COLOR * 0.8 * vignette
        const smoke = TSL.vec3(0.8, 0.344, 0.08)
            .mul(smokeIntensity)
            .mul(0.8)
            .mul(vignette)
            .toVar();

        // ── Secondary smoke: layeredNoise1_2(uv*4+t*0.5*MD, 1.8, 0.5, 3, 0.2) ──
        const smoke2UV = uv
            .mul(4.0)
            .add(TSL.vec2(t.mul(0.5 * MD_X), t.mul(0.5 * MD_Y)));
        const smoke2N = TSL.float(0.0).toVar();
        const s2Alpha = TSL.float(1.0).toVar();
        const s2Size = TSL.float(1.0).toVar();
        const s2Off = TSL.vec2(0.0, 0.0).toVar();
        TSL.Loop(3, () => {
            s2Off.addAssign(eHash2(TSL.vec2(s2Alpha, s2Size)).mul(10.0));
            smoke2N.addAssign(
                eNoise1(
                    smoke2UV
                        .mul(s2Size)
                        .add(TSL.vec2(t.mul(1.12), t.mul(-1.6)))
                        .add(s2Off),
                ).mul(s2Alpha),
            );
            s2Alpha.mulAssign(0.5);
            s2Size.mulAssign(1.8);
        });
        smoke2N.mulAssign((1 - 0.5) / (1 - Math.pow(0.5, 3)));

        // smoke *= pow(smoke2N, 2) * 1.5
        smoke.mulAssign(TSL.pow(smoke2N, 2.0).mul(1.5));

        // ── Layered particles (15 layers) ──
        const particles = TSL.vec3(0.0).toVar();
        const pSizeV = TSL.float(1.0).toVar();
        const pAlphaV = TSL.float(1.0).toVar();
        const pOffV = TSL.vec2(0.0, 0.0).toVar();
        TSL.Loop(LAYERS_COUNT, ({ i }) => {
            const nArg = uv.mul(pSizeV).mul(2.0).add(0.5);
            const nOff = TSL.vec2(eNoise1(nArg), eNoise1(nArg.add(100.0)))
                .sub(0.5)
                .mul(0.15);

            const bokehUV = uv
                .mul(pSizeV)
                .add(TSL.vec2(t.mul(MD_X), t.mul(MD_Y)))
                .add(pOffV)
                .add(nOff);

            const fp = fireParticlesFn(bokehUV, uv, t);

            // * alpha * (1 - smoothstep(0,1,smoke) * (i/layers))
            const smokeMask = TSL.float(1.0).sub(
                TSL.smoothstep(0.0, 1.0, smokeIntensity).mul(
                    TSL.float(i).div(TSL.float(LAYERS_COUNT)),
                ),
            );
            particles.addAssign(fp.mul(pAlphaV).mul(smokeMask));

            pOffV.addAssign(eHash2(TSL.vec2(pAlphaV, pAlphaV)).mul(10.0));
            pAlphaV.mulAssign(ALPHA_MOD);
            pSizeV.mulAssign(SIZE_MOD);
        });

        // col = particles + smoke + SMOKE_COLOR * 0.02
        const col = particles
            .add(smoke)
            .add(TSL.vec3(0.8, 0.344, 0.08).mul(0.02))
            .toVar();
        col.mulAssign(vignette);

        // col = smoothstep(-0.08, 1.0, col) — per component
        col.assign(
            TSL.vec3(
                TSL.smoothstep(-0.08, 1.0, col.x),
                TSL.smoothstep(-0.08, 1.0, col.y),
                TSL.smoothstep(-0.08, 1.0, col.z),
            ),
        );

        const brightness = TSL.max(col.x, TSL.max(col.y, col.z));
        const alpha = TSL.clamp(brightness.mul(1.3), 0.0, 0.95);
        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 11. Fireworks — 烟花
// ============================================================
export const createFireworksEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);
        const rand = tslRand();
        const color = TSL.vec3(0.0).toVar();
        const alpha = TSL.float(0.0).toVar();

        // Multiple burst centers
        TSL.Loop(5, ({ i }) => {
            const burstIdx = TSL.float(i);
            const burstSeed = TSL.floor(t.mul(0.3).add(burstIdx.mul(0.7)));

            // Burst center position (random)
            const cx = rand(TSL.vec2(burstSeed, burstIdx));
            const cy = rand(TSL.vec2(burstIdx, burstSeed)).mul(0.5).add(0.25);
            const burstCenter = TSL.vec2(cx, cy);

            // Burst phase (0 to 1 over ~3 seconds)
            const burstPhase = TSL.fract(t.mul(0.3).add(burstIdx.mul(0.7)));
            const expandRadius = burstPhase.mul(0.25);
            const fadeAlpha = TSL.smoothstep(1.0, 0.3, burstPhase).mul(
                TSL.smoothstep(0.0, 0.05, burstPhase),
            );

            // Burst color
            const burstColor = TSL.vec3(
                rand(TSL.vec2(burstSeed.add(1.0), burstIdx))
                    .mul(0.5)
                    .add(0.5),
                rand(TSL.vec2(burstSeed.add(2.0), burstIdx))
                    .mul(0.5)
                    .add(0.3),
                rand(TSL.vec2(burstSeed.add(3.0), burstIdx))
                    .mul(0.5)
                    .add(0.3),
            );

            // Radial particles
            TSL.Loop(24, ({ i: j }) => {
                const particleAngle = TSL.float(j)
                    .div(24.0)
                    .mul(Math.PI * 2.0);
                const particlePos = burstCenter.add(
                    TSL.vec2(
                        TSL.cos(particleAngle).mul(expandRadius),
                        TSL.sin(particleAngle)
                            .mul(expandRadius)
                            .sub(burstPhase.mul(burstPhase).mul(0.05)),
                    ),
                );

                const dist = TSL.length(uv.sub(particlePos));
                const spark = TSL.smoothstep(0.008, 0.0, dist);
                const trail = TSL.smoothstep(0.025, 0.0, dist).mul(0.3);

                color.addAssign(
                    burstColor.mul(spark.add(trail)).mul(fadeAlpha),
                );
                alpha.addAssign(spark.add(trail).mul(fadeAlpha).mul(0.15));
            });
        });

        alpha.assign(TSL.clamp(alpha, 0.0, 0.95));
        color.assign(TSL.clamp(color, 0.0, 1.0));
        return TSL.vec4(
            color.x,
            color.y,
            color.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 12. Bokeh — 光斑 (faithful port from GLSL: colored bokeh circle pulses)
// ============================================================
export const createBokehEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const ASPECT = width / height;

    const BK_RADIUS = 0.2;
    const BK_SMOOTH = 0.01;
    const BK_PId2 = Math.PI / 2;
    const BK_PI2 = Math.PI * 2;
    const BK_NUM = 64;
    const BK_TIME_SCALE = 2.0;
    const K1_X = 23.14069263277926;
    const K1_Y = 2.665144142690225;

    // bkRandom(x, y) → vec2 = abs(fract(vec2(cos(x*K1.x), sin(y*K1.y+166.6))))
    const bkRandom = TSL.Fn(
        ([x, y]: [THREE.Node<'float'>, THREE.Node<'float'>]) => {
            return TSL.vec2(
                TSL.abs(TSL.fract(TSL.cos(x.mul(K1_X)))),
                TSL.abs(TSL.fract(TSL.sin(y.mul(K1_Y).add(166.6)))),
            );
        },
    );

    // bkGenShift(xSeed, ySeed, time, ratioX, ratioY) → vec2
    // = (2*bkRandom(ceil(time/PI2)+xSeed, ceil(time/PI2)+ySeed) - 1) * ratio
    const bkGenShift = TSL.Fn(
        ([xSeed, ySeed, time, ratioX, ratioY]: [
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            const epoch = TSL.ceil(time.div(BK_PI2));
            const rnd = bkRandom(epoch.add(xSeed), epoch.add(ySeed));
            return TSL.vec2(
                rnd.x.mul(2.0).sub(1.0).mul(ratioX),
                rnd.y.mul(2.0).sub(1.0).mul(ratioY),
            );
        },
    );

    // bkSinWave01(time) = 0.5 + 0.5*sin(time - π/2)
    const bkSinWave01 = TSL.Fn(([time]: [THREE.Node<'float'>]) => {
        return TSL.float(0.5).add(TSL.sin(time.sub(BK_PId2)).mul(0.5));
    });

    // bkCircle(uv, r, blur) = smoothstep(r+blur, r, length(uv))
    const bkCircle = TSL.Fn(
        ([uvIn, r, blur]: [
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            return TSL.smoothstep(r.add(blur), r, TSL.length(uvIn));
        },
    );

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // uv = (2*v_uv - 1) * vec2(aspect, 1)
        const uv = TSL.vec2(
            rawUv.x.mul(2.0).sub(1.0).mul(ASPECT),
            rawUv.y.mul(2.0).sub(1.0),
        );
        const ratioX = TSL.float(ASPECT);
        const ratioY = TSL.float(1.0);

        const col = TSL.float(0.0).toVar();
        TSL.Loop(BK_NUM, ({ i }) => {
            const fi = TSL.float(i);
            const timeShift = fi.mul(2.0);
            const bkTime = TSL.float(BK_TIME_SCALE).mul(t.add(timeShift));
            const shift = bkGenShift(
                fi.mul(2.0),
                fi.add(56.0),
                bkTime,
                ratioX,
                ratioY,
            );
            const sw = bkSinWave01(bkTime);
            col.addAssign(
                bkCircle(
                    TSL.vec2(uv.x.sub(shift.x), uv.y.sub(shift.y)),
                    TSL.float(BK_RADIUS).mul(sw),
                    TSL.float(BK_SMOOTH),
                ).mul(TSL.float(1.0).sub(sw)),
            );
        });

        // Warm color palette based on hue = fract(col*0.3 + iTime*0.05)
        const hue = TSL.fract(col.mul(0.3).add(t.mul(0.05)));

        // 5 segments blended with smoothstep (replacing if/else)
        // gold(1,0.84,0) → orange(1,0.65,0) → amber(1,0.45,0.1) → lightYellow(1,0.9,0.4) → honey(0.95,0.75,0.2) → gold
        const s01 = TSL.smoothstep(0.0, 0.2, hue);
        const s12 = TSL.smoothstep(0.2, 0.4, hue);
        const s23 = TSL.smoothstep(0.4, 0.6, hue);
        const s34 = TSL.smoothstep(0.6, 0.8, hue);
        const s45 = TSL.smoothstep(0.8, 1.0, hue);

        const c0 = TSL.vec3(1.0, 0.84, 0.0); // gold
        const c1 = TSL.vec3(1.0, 0.65, 0.0); // orange
        const c2 = TSL.vec3(1.0, 0.45, 0.1); // amber
        const c3 = TSL.vec3(1.0, 0.9, 0.4); // light yellow
        const c4 = TSL.vec3(0.95, 0.75, 0.2); // honey

        const warmCol = TSL.mix(
            TSL.mix(
                TSL.mix(TSL.mix(c0, c1, s01), TSL.mix(c1, c2, s12), s12),
                TSL.mix(c2, c3, s23),
                s23,
            ),
            TSL.mix(c3, c4, s34),
            s34,
        );
        // Final wrap-around: blend back to gold at hue > 0.8
        const finalWarm = TSL.mix(warmCol, TSL.mix(c4, c0, s45), s45);

        const colClamped = TSL.clamp(col, 0.0, 1.0);
        const color = TSL.vec3(
            finalWarm.x.mul(colClamped),
            finalWarm.y.mul(colClamped),
            finalWarm.z.mul(colClamped),
        );

        const brightness = TSL.max(color.x, TSL.max(color.y, color.z));
        const alpha = TSL.clamp(brightness.mul(2.0), 0.0, 0.85);
        return TSL.vec4(
            color.x,
            color.y,
            color.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 13. Heartbeat — 心跳
// ============================================================
export const createHeartbeatEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const minDim = Math.min(width, height);
    const scaleX = (5.0 * width) / minDim;
    const scaleY = (5.0 * height) / minDim;

    // heart2D — geometric heart SDF
    const heart2DFn = TSL.Fn(([uvIn]: [THREE.Node<'vec2'>]) => {
        const huv = TSL.vec2(uvIn).toVar();
        huv.assign(huv.mul(0.5));
        huv.x.assign(TSL.abs(huv.x));
        huv.y.assign(
            TSL.float(-0.15)
                .sub(huv.y.mul(1.2))
                .add(huv.x.mul(TSL.float(1.0).sub(huv.x))),
        );
        return TSL.length(huv).sub(0.5);
    });

    // animate — heartbeat with exponential decay
    const animateFn = TSL.Fn(
        ([uvIn, speed]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const auv = TSL.vec2(uvIn).toVar();
            const tt = TSL.mod(uniforms.time.mul(uniforms.speed), 1.5).div(1.5);
            const ss0 = TSL.pow(tt, 0.2).mul(0.5).add(0.5);
            const ss = TSL.float(1.0).add(
                ss0
                    .mul(speed)
                    .mul(TSL.sin(tt.mul(6.2831 * 3.0).add(auv.y.mul(0.5))))
                    .mul(TSL.exp(tt.negate().mul(4.0))),
            );
            auv.assign(
                auv.mul(
                    TSL.vec2(
                        TSL.float(0.5).add(ss.mul(0.5)),
                        TSL.float(1.5).add(ss.mul(-0.5)),
                    ),
                ),
            );
            return auv;
        },
    );

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // P = 5.0 * (v_uv * iResolution - iResolution * 0.5) / minDim
        const P = TSL.vec2(
            rawUv.x.sub(0.5).mul(scaleX),
            rawUv.y.sub(0.5).mul(scaleY),
        );

        const uv = animateFn(P, TSL.float(1.5));
        const d = heart2DFn(uv);

        // col = 0.9 + sin(iTime + P.xyx + vec3(0, 2, 4))
        const col = TSL.vec3(
            TSL.float(0.9).add(TSL.sin(t.add(P.x))),
            TSL.float(0.9).add(TSL.sin(t.add(P.y).add(2.0))),
            TSL.float(0.9).add(TSL.sin(t.add(P.x).add(4.0))),
        );

        // soft edge
        const blend = TSL.clamp(d.div(0.04), 0.0, 1.0);
        const heartCol = TSL.mix(col, TSL.vec3(1.0), blend.mul(0.6).add(0.4));
        const alpha = TSL.float(1.0).sub(blend).mul(0.85);

        return TSL.vec4(
            heartCol.x,
            heartCol.y,
            heartCol.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 14. IntoYou — 心動 (faithful port from GLSL: 3D falling hearts with DOF)
// Based on "Into You" by Martijn Steinrucken aka BigWings - 2018
// ============================================================
export const createIntoYouEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // Polynomial smooth max (from IQ)
    const smaxFn = TSL.Fn(
        ([a, b, k]: [
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            const h = TSL.clamp(
                TSL.float(0.5).add(TSL.float(0.5).mul(b.sub(a)).div(k)),
                0.0,
                1.0,
            );
            return TSL.mix(a, b, h).add(k.mul(h).mul(TSL.float(1.0).sub(h)));
        },
    );

    // vec3 cross product helper
    const cross3 = TSL.Fn(([a, b]: [THREE.Node<'vec3'>, THREE.Node<'vec3'>]) =>
        TSL.vec3(
            a.y.mul(b.z).sub(a.z.mul(b.y)),
            a.z.mul(b.x).sub(a.x.mul(b.z)),
            a.x.mul(b.y).sub(a.y.mul(b.x)),
        ),
    );

    // Heart shape SDF on sphere UV
    const heartFn = TSL.Fn(
        ([uvIn, b]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const huv = TSL.vec2(uvIn).toVar();
            huv.x.mulAssign(0.5);
            const shape = smaxFn(TSL.sqrt(TSL.abs(huv.x)), b, b.mul(0.3)).mul(
                0.5,
            );
            huv.y.subAssign(shape.mul(TSL.float(1.0).sub(b)));
            return TSL.smoothstep(b, b.negate(), TSL.length(huv).sub(0.5));
        },
    );

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const uv = TSL.vec2(rawUv.x.sub(0.5).mul(aspect), rawUv.y.sub(0.5));
        const t = uniforms.time.mul(uniforms.speed).mul(0.3);
        const rd = TSL.normalize(TSL.vec3(uv.x, uv.y, 1.0));

        const rot = TSL.vec2(t.mul(0.12), t.mul(0.18)).toVar();
        const col = TSL.vec4(0.0, 0.0, 0.0, 0.0).toVar();

        TSL.Loop(40, ({ i }) => {
            const fi = TSL.float(i).div(40.0);

            // Pseudo-random position
            const x = TSL.fract(TSL.cos(fi.mul(536.3)).mul(7464.4))
                .sub(0.5)
                .mul(15.0);
            const y = TSL.fract(t.negate().mul(0.2).add(fi.mul(7.64)))
                .sub(0.5)
                .mul(15.0);
            const z = TSL.mix(TSL.float(14.0), TSL.float(2.0), fi);

            // Depth-of-field blur
            const blur = TSL.mix(
                TSL.float(0.03),
                TSL.float(0.35),
                TSL.smoothstep(0.0, 0.4, TSL.abs(TSL.float(0.4).sub(fi))),
            );

            // Accumulate rotation
            rot.addAssign(
                TSL.vec2(
                    TSL.fract(TSL.sin(fi.mul(536.3)).mul(764.4)).sub(0.5),
                    TSL.fract(TSL.sin(fi.mul(23.4)).mul(987.3)).sub(0.5),
                ),
            );

            const pos = TSL.vec3(x, y, z);

            // RaySphere: ray origin at 0, radius 1
            const rl = TSL.dot(rd, pos);
            const det = rl.mul(rl).sub(TSL.dot(pos, pos)).add(1.0);
            const hitValid = TSL.step(0.0, det);
            const sd = TSL.sqrt(TSL.max(det, 0.0));
            const iiX = rl.sub(sd); // front hit
            const iiY = rl.add(sd); // back hit
            const frontHit = TSL.step(0.001, iiX);
            const hitMask = hitValid.mul(frontHit);

            // Quaternion rotation from accumulated rot
            const rotScaled = rot.mul(6.2831);
            const halfA = rotScaled.y.mul(0.5);
            const qw = TSL.cos(halfA);
            const qs = TSL.sin(halfA);
            const qu = TSL.vec3(
                TSL.cos(rotScaled.x).mul(qs),
                TSL.sin(rotScaled.x).mul(qs),
                0.0,
            );

            // Rotate -pos by quaternion: v' = v + 2w(u×v) + 2(u×(u×v))
            const negPos = pos.negate();
            const c1 = cross3(qu, negPos);
            const rotNegPos = negPos
                .add(c1.mul(qw).mul(2.0))
                .add(cross3(qu, c1).mul(2.0));
            const o = rotNegPos.add(pos);

            // Rotate rd by quaternion
            const c2 = cross3(qu, rd);
            const dRot = rd
                .add(c2.mul(qw).mul(2.0))
                .add(cross3(qu, c2).mul(2.0));

            // Front surface UVs + normal
            const pp1 = o.add(dRot.mul(iiX)).sub(pos);
            const suv1 = TSL.vec2(TSL.atan(pp1.x, pp1.z), pp1.y);
            const sn1 = rd.mul(iiX).sub(pos);

            // Back surface UVs + normal
            const pp2 = o.add(dRot.mul(iiY)).sub(pos);
            const suv2 = TSL.vec2(TSL.atan(pp2.x, pp2.z), pp2.y);
            const sn2 = pos.sub(rd.mul(iiY));

            // Edge smoothing
            const sDist = TSL.length(cross3(pos, rd));
            const edge = TSL.smoothstep(1.0, TSL.mix(1.0, 0.1, blur), sDist);

            // Heart masks on sphere surfaces
            const backMask = heartFn(suv2, blur).mul(edge);
            const frontMask = heartFn(suv1, blur).mul(edge);

            // Directional lighting
            const lightDir = TSL.vec3(0.577, -0.577, -0.577);
            const frontLight = TSL.clamp(
                TSL.dot(lightDir, sn1).mul(0.8).add(0.2),
                0.0,
                1.0,
            );
            const backLight = TSL.clamp(
                TSL.dot(lightDir, sn2).mul(0.8).add(0.2),
                0.0,
                1.0,
            ).mul(0.9);

            // Heart color compositing
            const heartCol = TSL.vec3(1.0, 0.01, 0.01);
            const rgb = TSL.mix(
                heartCol.mul(backLight),
                heartCol.mul(frontLight),
                frontMask,
            );
            const heartA = TSL.mix(backMask, frontMask, frontMask).mul(hitMask);

            // Front-to-back compositing: col = mix(col, heart, heart.a)
            col.assign(
                TSL.vec4(
                    TSL.mix(col.x, rgb.x, heartA),
                    TSL.mix(col.y, rgb.y, heartA),
                    TSL.mix(col.z, rgb.z, heartA),
                    TSL.mix(col.w, heartA, heartA),
                ),
            );
        });

        return TSL.vec4(col.x, col.y, col.z, col.w.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 15. Stars — 星光
// ============================================================
export const createStarsEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed).mul(0.2);
        const color = TSL.vec3(0.0).toVar();
        const alpha = TSL.float(0.0).toVar();

        // GLSL: I = v_uv * iResolution.xy; then sin(I / iResolution.y * 60.0 / i ...)
        // → uv.x * aspect and uv.y, both scaled by 60.0/i — keeps circles circular
        TSL.Loop(49, ({ i }) => {
            const idx = TSL.float(i).add(2.0);
            // Rainbow color per layer
            const cr = idx.mul(TSL.cos(idx)).add(idx).mul(3e-4);
            const cg = idx
                .mul(TSL.cos(idx.add(2.0)))
                .add(idx)
                .mul(3e-4);
            const cb = idx
                .mul(TSL.cos(idx.add(4.0)))
                .add(idx)
                .mul(3e-4);

            // Orb position and falloff — aspect-corrected x to keep circles
            const px = TSL.sin(
                uv.x
                    .mul(aspect)
                    .mul(60.0)
                    .div(idx)
                    .add(t)
                    .add(TSL.cos(idx.mul(9.0))),
            );
            const py = TSL.sin(
                uv.y
                    .mul(60.0)
                    .div(idx)
                    .add(t)
                    .add(TSL.cos(idx.mul(7.0))),
            );
            const len = TSL.max(TSL.length(TSL.vec2(px, py)), 0.001);

            color.x.addAssign(cr.div(len));
            color.y.addAssign(cg.div(len));
            color.z.addAssign(cb.div(len));
        });

        // Tone mapping (tanh approximation)
        const sq = color.mul(color);
        const mapped = TSL.vec3(
            sq.x.mul(2.0).div(sq.x.mul(2.0).add(1.0)),
            sq.y.mul(2.0).div(sq.y.mul(2.0).add(1.0)),
            sq.z.mul(2.0).div(sq.z.mul(2.0).add(1.0)),
        );
        const c = TSL.clamp(mapped, 0.0, 1.0);
        const brightness = TSL.max(c.x, TSL.max(c.y, c.z));
        alpha.assign(TSL.clamp(brightness.mul(1.3), 0.0, 0.95));

        return TSL.vec4(c.x, c.y, c.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 16. Nebula — 星云 (faithful port from GLSL, based on 4rknova 2013)
// ============================================================
export const createNebulaEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // hash3(vec3) → float
    const nHash3 = TSL.Fn(([p]: [THREE.Node<'vec3'>]) =>
        TSL.fract(
            TSL.sin(TSL.dot(p, TSL.vec3(283.6, 127.1, 311.7))).mul(43758.5453),
        ),
    );

    // 3D value noise with fft/wav time modulation
    const nNoise = TSL.Fn(
        ([pIn, fft, wav]: [
            THREE.Node<'vec3'>,
            THREE.Node<'vec3'>,
            THREE.Node<'vec3'>,
        ]) => {
            const t = uniforms.time.mul(uniforms.speed);
            const pp = TSL.vec3(
                pIn.x.add(TSL.cos(wav.y).mul(2.0)),
                pIn.y.sub(t.mul(2.0)).sub(fft.x.mul(fft.y).mul(2.0)),
                pIn.z.add(t.mul(0.4)).sub(fft.z),
            ).toVar();

            const i = TSL.floor(pp).toVar();
            const f = TSL.fract(pp).toVar();
            // smoothstep interpolation: f *= f * (3.0 - 2.0 * f)
            f.assign(f.mul(f).mul(TSL.vec3(3.0).sub(f.mul(2.0))));

            // trilinear interpolation of hash3
            const n000 = nHash3(i.add(TSL.vec3(0, 0, 0)));
            const n100 = nHash3(i.add(TSL.vec3(1, 0, 0)));
            const n010 = nHash3(i.add(TSL.vec3(0, 1, 0)));
            const n110 = nHash3(i.add(TSL.vec3(1, 1, 0)));
            const n001 = nHash3(i.add(TSL.vec3(0, 0, 1)));
            const n101 = nHash3(i.add(TSL.vec3(1, 0, 1)));
            const n011 = nHash3(i.add(TSL.vec3(0, 1, 1)));
            const n111 = nHash3(i.add(TSL.vec3(1, 1, 1)));

            const mx0 = TSL.mix(
                TSL.mix(n000, n100, f.x),
                TSL.mix(n010, n110, f.x),
                f.y,
            );
            const mx1 = TSL.mix(
                TSL.mix(n001, n101, f.x),
                TSL.mix(n011, n111, f.x),
                f.y,
            );
            return TSL.mix(mx0, mx1, f.z);
        },
    );

    // FBM: 4 octaves with fixed weights
    const nFbm = TSL.Fn(
        ([p, fft, wav]: [
            THREE.Node<'vec3'>,
            THREE.Node<'vec3'>,
            THREE.Node<'vec3'>,
        ]) =>
            nNoise(p.mul(1.0), fft, wav)
                .mul(0.5)
                .add(nNoise(p.mul(2.0), fft, wav).mul(0.25))
                .add(nNoise(p.mul(4.0), fft, wav).mul(0.125))
                .add(nNoise(p.mul(8.0), fft, wav).mul(0.0625)),
    );

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // Simulated audio data (sin-wave driven)
        const fft = TSL.vec3(
            TSL.float(0.5).add(TSL.sin(t.mul(0.7)).mul(0.3)),
            TSL.float(0.4).add(TSL.sin(t.mul(1.1).add(1.0)).mul(0.3)),
            TSL.float(0.3).add(TSL.sin(t.mul(0.5).add(2.0)).mul(0.2)),
        );
        const wav = TSL.vec3(
            TSL.float(0.5).add(TSL.sin(t.mul(0.3).add(0.5)).mul(0.4)),
            TSL.float(0.5).add(TSL.sin(t.mul(0.8).add(1.5)).mul(0.4)),
            TSL.float(0.5).add(TSL.sin(t.mul(0.6).add(3.0)).mul(0.4)),
        );

        // Rotation angle from fft
        const rotT = TSL.cos(fft.x.mul(2.0 / Math.PI));
        const ct = TSL.cos(rotT);
        const st = TSL.sin(rotT);

        // NDC with aspect correction
        const vc = uv.mul(2.0).sub(1.0).mul(TSL.vec2(aspect, 1.0)).toVar();

        // Rotate vc
        vc.assign(
            TSL.vec2(
                vc.x.mul(ct).sub(vc.y.mul(st)),
                vc.y.mul(ct).add(vc.x.mul(st)),
            ),
        );

        // Ray direction
        const rd = TSL.normalize(TSL.vec3(0.5, vc.x, vc.y));

        // FBM on ray direction
        const f = nFbm(rd, fft, wav);

        // Smooth mapping to avoid dark spots
        const fMapped = TSL.smoothstep(0.05, 0.7, f).mul(0.85).add(0.15);

        // Color = 2.0 * f * fft
        const color = TSL.vec3(fMapped).mul(2.0).mul(fft).toVar();

        // Grain texture
        const grain = nHash3(
            TSL.vec3(uv.x.mul(50.0), uv.y.mul(50.0), t.mul(0.1)),
        ).mul(0.08);
        color.addAssign(TSL.vec3(grain));

        // Vignette
        const vignette = TSL.clamp(
            TSL.float(1.0).sub(TSL.length(uv.sub(0.5)).mul(1.2)),
            0.0,
            1.0,
        );
        color.mulAssign(vignette);

        // Brighten: pow(c, 0.8) * 1.5
        color.assign(
            TSL.vec3(
                TSL.pow(TSL.max(color.x, 0.0), 0.8),
                TSL.pow(TSL.max(color.y, 0.0), 0.8),
                TSL.pow(TSL.max(color.z, 0.0), 0.8),
            ).mul(1.5),
        );

        const brightness = TSL.max(color.x, TSL.max(color.y, color.z));
        const alpha = TSL.clamp(brightness.mul(1.5), 0.0, 0.92);
        color.assign(TSL.clamp(color, 0.0, 1.0));
        return TSL.vec4(
            color.x,
            color.y,
            color.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 17. Flare — 光晕 (3 modes, faithful port from GLSL)
// ============================================================
export const createFlareEffectMesh = (
    width: number,
    height: number,
): FlareEffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const baseUniforms = createBaseUniforms();
    const typeUniform = TSL.uniform(1.0);
    const aspect = width / height;

    // frnd1(float) → fract(sin(w)*1000)
    const frnd1 = TSL.Fn(([w]: [THREE.Node<'float'>]) =>
        TSL.fract(TSL.sin(w).mul(1000.0)),
    );

    // frnd2(vec2) → [0.5,1)
    const frnd2 = TSL.Fn(([p]: [THREE.Node<'vec2'>]) =>
        TSL.fract(TSL.sin(TSL.dot(p, TSL.vec2(12.1234, 72.8392)).mul(45123.2)))
            .mul(0.5)
            .add(0.5),
    );

    // regShape for hexagonal lens ghosts
    const regShape = TSL.Fn(
        ([p, N]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const a = TSL.atan(p.x, p.y).add(0.2);
            const b = TSL.float(Math.PI * 2.0).div(N);
            return TSL.smoothstep(
                0.5,
                0.51,
                TSL.cos(
                    TSL.floor(TSL.float(0.5).add(a.div(b)))
                        .mul(b)
                        .sub(a),
                ).mul(TSL.length(p)),
            );
        },
    );

    // 2D value noise
    const tNoise = TSL.Fn(([p]: [THREE.Node<'vec2'>]) => {
        const i = TSL.floor(p);
        const f = TSL.fract(p).toVar();
        f.assign(f.mul(f).mul(TSL.vec2(3.0).sub(f.mul(2.0))));
        return TSL.mix(
            TSL.mix(frnd2(i), frnd2(i.add(TSL.vec2(1.0, 0.0))), f.x),
            TSL.mix(
                frnd2(i.add(TSL.vec2(0.0, 1.0))),
                frnd2(i.add(TSL.vec2(1.0, 1.0))),
                f.x,
            ),
            f.y,
        );
    });

    // FBM: 5 octaves
    const tFbm = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const v = TSL.float(0.0).toVar();
        const a = TSL.float(0.5).toVar();
        const pp = pIn.toVar();
        TSL.Loop(5, () => {
            v.addAssign(a.mul(tNoise(pp)));
            pp.mulAssign(2.0);
            a.mulAssign(0.5);
        });
        return v;
    });

    // rayLine: Gaussian beam with inner + outer falloff
    const rayLine = TSL.Fn(
        ([uvP, origin, dir, width]: [
            THREE.Node<'vec2'>,
            THREE.Node<'vec2'>,
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
        ]) => {
            const d = uvP.sub(origin);
            const proj = TSL.dot(d, dir);
            const perp = TSL.length(d.sub(dir.mul(proj)));
            const forward = TSL.smoothstep(-0.1, 0.1, proj);
            const wSq = width.mul(width);
            const inner = TSL.exp(
                perp.mul(perp).negate().div(wSq.mul(2.0)),
            ).mul(0.6);
            const outer = TSL.exp(
                perp.mul(perp).negate().div(wSq.mul(8.0)),
            ).mul(0.25);
            return inner.add(outer).mul(forward);
        },
    );

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv().sub(0.5).toVar();
        uv.x.assign(uv.x.mul(aspect));
        const t = baseUniforms.time.mul(baseUniforms.speed);

        // Light source at top-right corner outside viewport
        const lightSrc = TSL.vec2(
            TSL.float(aspect * 0.52 + 0.05),
            TSL.float(0.55),
        );
        const toPixel = uv.sub(lightSrc);
        const distToLight = TSL.length(toPixel);

        // Animation cycle: ~8s pop in → slide → fade out
        const cycle = 8.0;
        const tMod = TSL.mod(t, cycle);
        const fadeIn = TSL.smoothstep(0.0, 1.0, tMod);
        const fadeOut = TSL.float(1.0).sub(TSL.smoothstep(6.0, 8.0, tMod));
        const anim = fadeIn.mul(fadeOut);

        // Angle slides from 30° to 15° over the cycle + breathing
        const angBase = TSL.float(0.52).sub(tMod.div(cycle).mul(0.26));
        const angRad = angBase.add(TSL.sin(t.mul(0.3)).mul(0.02));

        const color = TSL.vec3(0.0).toVar();

        // Mode selection via smoothstep masks (TSL has no branching on uniforms)
        // mode1: typeUniform < 1.5, mode2: 1.5..2.5, mode3: > 2.5
        const isMode1 = TSL.smoothstep(1.5, 1.4, typeUniform); // 1.0 when type≤1.4
        const isMode2 = TSL.smoothstep(1.4, 1.5, typeUniform).mul(
            TSL.smoothstep(2.5, 2.4, typeUniform),
        );
        const isMode3 = TSL.smoothstep(2.4, 2.5, typeUniform);

        // === Mode 1: Sunny rays + colorful lens flare ===
        const c1 = TSL.vec3(0.0).toVar();

        // 3 wide soft rays
        TSL.Loop(3, ({ i }) => {
            const ii = TSL.float(i);
            const off = ii.sub(1.0).mul(0.05);
            const ang = angRad.add(off);
            const dir = TSL.normalize(
                TSL.vec2(TSL.cos(ang).negate(), TSL.sin(ang).negate()),
            );
            const w = TSL.float(0.025).add(ii.mul(0.008));
            const ray = rayLine(uv, lightSrc, dir, w).toVar();
            const d = uv.sub(lightSrc);
            const proj = TSL.dot(d, dir);
            ray.mulAssign(TSL.exp(TSL.max(proj, 0.0).negate().mul(0.25)));
            const rayCol = TSL.vec3(
                TSL.cos(TSL.float(0.2).mul(6.0).add(ii.mul(2.5)))
                    .mul(0.3)
                    .add(1.0),
                TSL.cos(TSL.float(0.5).mul(6.0).add(ii.mul(2.5)))
                    .mul(0.3)
                    .add(0.9),
                TSL.cos(TSL.float(0.8).mul(6.0).add(ii.mul(2.5)))
                    .mul(0.3)
                    .add(0.75),
            );
            c1.addAssign(rayCol.mul(ray).mul(anim).mul(0.7));
        });

        // Corner glow
        const cornerGlow1 = TSL.exp(distToLight.negate().mul(1.5));
        c1.addAssign(
            TSL.vec3(1.0, 0.95, 0.85).mul(cornerGlow1).mul(0.8).mul(anim),
        );

        // 8 colored lens spots along main ray axis
        const mainDir = TSL.normalize(
            TSL.vec2(TSL.cos(angRad).negate(), TSL.sin(angRad).negate()),
        );
        TSL.Loop(8, ({ i }) => {
            const ii = TSL.float(i);
            const st = TSL.float(0.2).add(frnd1(ii.mul(123.7)).mul(1.5));
            const spotPos = lightSrc.add(mainDir.mul(st));
            const spotSize = frnd1(ii.mul(456.3)).mul(0.06).add(0.025);
            const spotDist = TSL.length(uv.sub(spotPos));
            const spot = TSL.max(
                TSL.float(1.0).sub(spotDist.div(spotSize)),
                0.0,
            );
            const spotCubed = spot.mul(spot).mul(spot);
            // Hex ghost
            const hexVal = TSL.max(
                TSL.float(0.01).sub(
                    TSL.pow(
                        regShape(
                            uv
                                .sub(spotPos)
                                .mul(TSL.float(7.0).add(ii.mul(1.5))),
                            TSL.float(6.0),
                        ),
                        1.0,
                    ),
                ),
                0.0,
            ).mul(6.0);
            const spotColor = TSL.vec3(
                TSL.cos(TSL.float(0.4).mul(8.0).add(ii.mul(1.2)))
                    .mul(0.5)
                    .add(0.5),
                TSL.cos(TSL.float(0.25).mul(8.0).add(ii.mul(1.2)))
                    .mul(0.5)
                    .add(0.5),
                TSL.cos(TSL.float(0.15).mul(8.0).add(ii.mul(1.2)))
                    .mul(0.5)
                    .add(0.5),
            );
            c1.addAssign(
                spotCubed.mul(4.0).add(hexVal).mul(spotColor).mul(anim),
            );
        });

        // 3 rainbow rings
        TSL.Loop(3, ({ i }) => {
            const ii = TSL.float(i);
            const ringT = TSL.float(0.4).add(ii.mul(0.35));
            const ringCenter = lightSrc.add(mainDir.mul(ringT));
            const ringDist = TSL.length(uv.sub(ringCenter));
            const ringR = TSL.float(0.06).add(ii.mul(0.03));
            const ring = TSL.exp(
                TSL.pow(ringDist.sub(ringR).mul(25.0), 2.0).negate(),
            ).mul(0.4);
            const ringCol = TSL.vec3(
                TSL.cos(TSL.float(0.0).add(ii.mul(2.0)))
                    .mul(0.5)
                    .add(0.5),
                TSL.cos(TSL.float(2.1).add(ii.mul(2.0)))
                    .mul(0.5)
                    .add(0.5),
                TSL.cos(TSL.float(4.2).add(ii.mul(2.0)))
                    .mul(0.5)
                    .add(0.5),
            );
            c1.addAssign(ringCol.mul(ring).mul(anim));
        });

        // === Mode 2: Tyndall light — clear beam lines with noise ===
        const c2 = TSL.vec3(0.0).toVar();

        const cornerGlow2 = TSL.exp(distToLight.negate().mul(1.2));
        c2.addAssign(
            TSL.vec3(1.0, 0.9, 0.65).mul(cornerGlow2).mul(0.8).mul(anim),
        );

        // 5 Tyndall beams with noise dappling
        TSL.Loop(5, ({ i }) => {
            const ii = TSL.float(i);
            const beamOff = ii
                .sub(2.0)
                .mul(0.1)
                .add(TSL.sin(t.mul(0.06).add(ii.mul(1.7))).mul(0.03));
            const ang = angRad.add(beamOff);
            const dir = TSL.normalize(
                TSL.vec2(TSL.cos(ang).negate(), TSL.sin(ang).negate()),
            );
            const w = TSL.float(0.03).add(ii.mul(0.008));
            const ray = rayLine(uv, lightSrc, dir, w).toVar();
            const d = uv.sub(lightSrc);
            const proj = TSL.dot(d, dir);
            ray.mulAssign(TSL.exp(TSL.max(proj, 0.0).negate().mul(0.18)));
            // Noise dappling
            const n = tFbm(
                TSL.vec2(
                    proj.mul(3.0).add(ii.mul(10.0)),
                    TSL.length(d.sub(dir.mul(proj)))
                        .mul(6.0)
                        .sub(t.mul(0.04)),
                ),
            );
            ray.mulAssign(TSL.smoothstep(0.2, 0.6, n));
            c2.addAssign(TSL.vec3(1.0, 0.85, 0.5).mul(ray).mul(0.5).mul(anim));
        });

        // Scatter fog
        const scatter = TSL.exp(distToLight.negate().mul(0.8)).mul(0.15);
        c2.addAssign(TSL.vec3(1.0, 0.92, 0.7).mul(scatter).mul(anim));

        // Dust particles
        const rawUv = TSL.uv();
        const dust = tNoise(rawUv.mul(80.0).add(t.mul(0.3))).mul(
            tNoise(rawUv.mul(40.0).sub(t.mul(0.2))),
        );
        c2.addAssign(
            TSL.vec3(1.0, 0.9, 0.7)
                .mul(dust)
                .mul(TSL.exp(distToLight.negate().mul(1.0)))
                .mul(0.2)
                .mul(anim),
        );

        // === Mode 3: Golden sunset — warm wide rays ===
        const c3 = TSL.vec3(0.0).toVar();

        const cornerGlow3 = TSL.exp(distToLight.negate().mul(1.0));
        c3.addAssign(
            TSL.vec3(1.0, 0.6, 0.2).mul(cornerGlow3).mul(0.8).mul(anim),
        );

        // 2 warm wide rays
        TSL.Loop(2, ({ i }) => {
            const ii = TSL.float(i);
            const off = ii.sub(0.5).mul(0.07);
            const ang = angRad.add(off);
            const dir = TSL.normalize(
                TSL.vec2(TSL.cos(ang).negate(), TSL.sin(ang).negate()),
            );
            const w = TSL.float(0.04).add(ii.mul(0.015));
            const ray = rayLine(uv, lightSrc, dir, w).toVar();
            const d = uv.sub(lightSrc);
            const proj = TSL.dot(d, dir);
            ray.mulAssign(TSL.exp(TSL.max(proj, 0.0).negate().mul(0.15)));
            c3.addAssign(
                TSL.vec3(1.0, 0.65, 0.25).mul(ray).mul(0.45).mul(anim),
            );
        });

        // Radiating rays
        const a = TSL.atan(toPixel.y, toPixel.x);
        const rays = TSL.pow(
            TSL.abs(TSL.sin(a.mul(12.0).add(TSL.cos(a.mul(5.0)).mul(2.0)))),
            3.0,
        ).mul(TSL.exp(distToLight.negate().mul(1.5)));
        c3.addAssign(TSL.vec3(1.0, 0.75, 0.35).mul(rays).mul(0.3).mul(anim));

        // Warm gradient
        const warmGrad = TSL.smoothstep(1.8, 0.0, distToLight);
        c3.addAssign(TSL.vec3(1.0, 0.5, 0.1).mul(warmGrad).mul(0.12).mul(anim));

        // 4 scatter spots
        TSL.Loop(4, ({ i }) => {
            const ii = TSL.float(i);
            const st = TSL.float(0.2).add(frnd1(ii.mul(789.1)).mul(1.2));
            const sp = lightSrc.add(mainDir.mul(st));
            const sd = TSL.length(uv.sub(sp));
            const ss = frnd1(ii.mul(321.7)).mul(0.04).add(0.02);
            const sv = TSL.exp(sd.mul(sd).negate().div(ss.mul(ss))).mul(0.5);
            const sc = TSL.vec3(
                TSL.cos(TSL.float(0.0).add(ii.mul(1.8)))
                    .mul(0.3)
                    .add(1.0),
                TSL.cos(TSL.float(2.1).add(ii.mul(1.8)))
                    .mul(0.3)
                    .add(0.7),
                TSL.cos(TSL.float(4.2).add(ii.mul(1.8)))
                    .mul(0.3)
                    .add(0.4),
            );
            c3.addAssign(sc.mul(sv).mul(anim));
        });

        // Blend modes
        color.addAssign(c1.mul(isMode1));
        color.addAssign(c2.mul(isMode2));
        color.addAssign(c3.mul(isMode3));

        const brightness = TSL.max(color.x, TSL.max(color.y, color.z));
        const alpha = TSL.clamp(brightness.mul(2.0), 0.0, 0.95);
        color.assign(TSL.clamp(color, 0.0, 1.0));
        return TSL.vec4(
            color.x,
            color.y,
            color.z,
            alpha.mul(baseUniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return {
        mesh,
        uniforms: { ...baseUniforms, type: typeUniform },
    };
};

// ============================================================
// 18. Laser — 激光 (faithful port from GLSL: atan laser + fbm clouds)
// ============================================================
export const createLaserEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // lrand(vec2) — hash using vec3 fract trick
    const lrand = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const p = TSL.vec2(pIn).mul(500.0).toVar();
        const p3 = TSL.fract(TSL.vec3(p.x, p.y, p.x).mul(0.1031)).toVar();
        const d = TSL.dot(p3, TSL.vec3(p3.y, p3.z, p3.x).add(33.33));
        p3.addAssign(d);
        return TSL.fract(p3.x.add(p3.y).mul(p3.z));
    });

    // lnoise(vec2) — 2D value noise with smoothstep interpolation
    const lnoise = TSL.Fn(([p]: [THREE.Node<'vec2'>]) => {
        const fr = TSL.fract(p);
        const f = TSL.vec2(
            TSL.smoothstep(0.0, 1.0, fr.x),
            TSL.smoothstep(0.0, 1.0, fr.y),
        );
        const i = TSL.floor(p);
        const a = lrand(i);
        const b = lrand(i.add(TSL.vec2(1.0, 0.0)));
        const c = lrand(i.add(TSL.vec2(0.0, 1.0)));
        const dd = lrand(i.add(TSL.vec2(1.0, 1.0)));
        return TSL.mix(TSL.mix(a, b, f.x), TSL.mix(c, dd, f.x), f.y);
    });

    // lfbm(vec2) — 8-octave FBM
    const lfbm = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const p = TSL.vec2(pIn).toVar();
        const amp = TSL.float(0.5).toVar();
        const r = TSL.float(0.0).toVar();
        TSL.Loop(8, () => {
            r.addAssign(amp.mul(lnoise(p)));
            amp.mulAssign(0.5);
            p.mulAssign(2.0);
        });
        return r;
    });

    // laser(vec2 p, float num, float time) — atan beam + glow
    const laserFn = TSL.Fn(
        ([p, num, time]: [
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            const r = TSL.atan(p.x, p.y);
            const sn = TSL.sin(r.mul(num).add(time));
            const lzr0 = TSL.float(0.5).add(sn.mul(0.5));
            const lzr = lzr0.mul(lzr0).mul(lzr0).mul(lzr0).mul(lzr0);
            const glow = TSL.pow(TSL.clamp(sn, 0.0, 1.0), 100.0);
            return lzr.add(glow);
        },
    );

    // clouds(vec2 uv, float time) — domain-warped FBM fog
    const cloudsFn = TSL.Fn(
        ([uvC, tTime]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const tV = TSL.vec2(0.0, tTime);
            const c1 = lfbm(
                lfbm(uvC.mul(3.0)).mul(0.75).add(uvC.mul(3.0)).add(tV.div(3.0)),
            );
            const c2 = lfbm(
                lfbm(uvC.mul(2.0)).mul(0.5).add(uvC.mul(7.0)).add(tV.div(3.0)),
            );
            const c3 = lfbm(
                lfbm(uvC.mul(10.0).sub(tV))
                    .mul(0.75)
                    .add(uvC.mul(5.0))
                    .add(tV.div(6.0)),
            );
            const r = TSL.mix(c1, c2, c3.mul(c3));
            return r.mul(r);
        },
    );

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // Aspect-correct UVs: uv = v_uv * iRes.xy / iRes.y
        const uvN = TSL.vec2(rawUv.x.mul(aspect), rawUv.y).toVar();
        const hsX = TSL.float(aspect * 0.5);
        // const hsY = TSL.float(0.5);
        const uvcX = uvN.x.sub(hsX);
        // const uvcY = uvN.y.sub(hsY);

        // Beam 1: modulated by noise, with y-stretch
        const beam1Mod = TSL.float(1.0).add(
            lnoise(
                TSL.vec2(TSL.float(15.0).sub(t), TSL.float(15.0).sub(t)),
            ).mul(3.0),
        );
        const yStretch = TSL.float(0.5).add(
            lnoise(TSL.vec2(t.div(5.0), t.div(5.0))).mul(10.0),
        );
        const beam1 = laserFn(
            TSL.vec2(uvN.x.add(0.5), uvN.y.mul(yStretch).add(0.1)),
            TSL.float(15.0),
            t,
        );
        const l = beam1Mod.mul(beam1).toVar();

        // Beam 2: reflected, modulated by FBM
        const beam2Mod = lfbm(TSL.vec2(t.mul(2.0), t.mul(2.0)));
        const beam2 = laserFn(
            TSL.vec2(hsX.sub(uvcX).sub(0.2), uvN.y.add(0.1)),
            TSL.float(25.0),
            t,
        );
        l.addAssign(beam2Mod.mul(beam2));

        // Beam 3: from below
        const beam3Mod = lnoise(TSL.vec2(t.sub(73.0), t.sub(73.0)));
        const beam3 = laserFn(
            TSL.vec2(uvcX, TSL.float(1.0).sub(uvN.y).add(0.5)),
            TSL.float(30.0),
            t,
        );
        l.addAssign(beam3Mod.mul(beam3));

        // Clouds fog overlay
        const c = cloudsFn(uvN, t);

        // Compose: green laser through fog
        const luminance = uvN.y.mul(l).add(uvN.y.mul(uvN.y));
        const col = TSL.vec3(0.0, 1.0, 0.0).mul(luminance).mul(c).toVar();
        col.assign(
            TSL.vec3(
                TSL.pow(TSL.max(col.x, 0.0), 0.75),
                TSL.pow(TSL.max(col.y, 0.0), 0.75),
                TSL.pow(TSL.max(col.z, 0.0), 0.75),
            ),
        );

        const brightness = TSL.max(col.x, TSL.max(col.y, col.z));
        const alpha = TSL.clamp(brightness.mul(1.8), 0.0, 0.95);
        col.assign(TSL.clamp(col, 0.0, 1.0));
        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 19. Pulse — 脉冲 (faithful port from GLSL: sine wave beams)
// ============================================================
export const createPulseEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    // Constants matching GLSL #defines
    const PULSE_SPEED = 15.0;
    const PULSE_FREQ = 8.0;
    const PULSE_MAX_HEIGHT = 0.3;
    const PULSE_THICKNESS = 0.005;
    const PULSE_BLOOM = 0.65;
    const PULSE_WOBBLE = 0.1;

    // beam(uv, max_height, offset, speed, freq, thickness, iTime)
    const beamFn = TSL.Fn(
        ([uvIn, maxH, offset, speed, freq, thickness, iTime]: [
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            const uvY = uvIn.y.sub(0.5).toVar();
            const height = maxH
                .mul(
                    TSL.float(PULSE_WOBBLE).add(
                        TSL.min(TSL.float(1.0).sub(uvIn.x), 1.0),
                    ),
                )
                .toVar();
            const ramp = TSL.smoothstep(0.0, TSL.float(2.0).div(freq), uvIn.x);
            height.mulAssign(ramp);
            uvY.addAssign(
                TSL.sin(uvIn.x.mul(freq).sub(iTime.mul(speed)).add(offset)).mul(
                    height,
                ),
            );
            const f = thickness.div(TSL.abs(uvY));
            return TSL.pow(f, PULSE_BLOOM);
        },
    );

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // 4 overlaid beams matching GLSL main()
        const f1 = beamFn(
            uv,
            TSL.float(PULSE_MAX_HEIGHT),
            TSL.float(0.0),
            TSL.float(PULSE_SPEED),
            TSL.float(PULSE_FREQ * 1.5),
            TSL.float(PULSE_THICKNESS * 0.5),
            t,
        );
        const f2 = beamFn(
            uv,
            TSL.float(PULSE_MAX_HEIGHT),
            t,
            TSL.float(PULSE_SPEED),
            TSL.float(PULSE_FREQ),
            TSL.float(PULSE_THICKNESS),
            t,
        );
        const f3 = beamFn(
            uv,
            TSL.float(PULSE_MAX_HEIGHT),
            t.add(0.5),
            TSL.float(PULSE_SPEED + 0.2),
            TSL.float(PULSE_FREQ * 0.9),
            TSL.float(PULSE_THICKNESS * 0.5),
            t,
        );
        const f4 = beamFn(
            uv,
            TSL.float(0.0),
            TSL.float(0.0),
            TSL.float(PULSE_SPEED),
            TSL.float(PULSE_FREQ),
            TSL.float(PULSE_THICKNESS * 3.0),
            t,
        );

        const f = f1.add(f2).add(f3).add(f4);
        const col = TSL.vec3(0.5, 0.05, 0.15).mul(f).toVar();
        col.assign(TSL.clamp(col, 0.0, 1.0));

        const brightness = TSL.max(col.x, TSL.max(col.y, col.z));
        const alpha = TSL.clamp(brightness.mul(2.0), 0.0, 0.95);
        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 20. Fog — 迷雾 (faithful port from GLSL: 2D FBM rolling fog + light sources)
// ============================================================
export const createFogEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // fogHash(vec2 p) -> float
    const fogHashFn = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        // p3 = fract(vec3(p.xyx) * 0.1031)
        const p3 = TSL.vec3(
            TSL.fract(pIn.x.mul(0.1031)),
            TSL.fract(pIn.y.mul(0.1031)),
            TSL.fract(pIn.x.mul(0.1031)),
        ).toVar();
        // p3 += dot(p3, p3.yzx + 33.33)
        const d = TSL.dot(
            p3,
            TSL.vec3(p3.y.add(33.33), p3.z.add(33.33), p3.x.add(33.33)),
        );
        p3.addAssign(TSL.vec3(d));
        return TSL.fract(p3.x.add(p3.y).mul(p3.z));
    });

    // fogNoise(vec2 p) -> float (bilinear value noise with hermite)
    const fogNoiseFn = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const ip = TSL.floor(pIn);
        const fp = TSL.fract(pIn).toVar();
        // f = f * f * (3.0 - 2.0 * f) — hermite
        fp.assign(fp.mul(fp).mul(TSL.vec2(3.0).sub(fp.mul(2.0))));
        const a = fogHashFn(ip);
        const b = fogHashFn(ip.add(TSL.vec2(1.0, 0.0)));
        const c = fogHashFn(ip.add(TSL.vec2(0.0, 1.0)));
        const d = fogHashFn(ip.add(TSL.vec2(1.0, 1.0)));
        return TSL.mix(TSL.mix(a, b, fp.x), TSL.mix(c, d, fp.x), fp.y);
    });

    // fogFbm(vec2 p) -> float (6-octave with rotation)
    const fogFbmFn = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const v = TSL.float(0.0).toVar();
        const a = TSL.float(0.5).toVar();
        const fp = TSL.vec2(pIn).toVar();
        // mat2 rot = mat2(0.8, 0.6, -0.6, 0.8) — column-major
        // rot * p = vec2(0.8*p.x - 0.6*p.y, 0.6*p.x + 0.8*p.y)
        TSL.Loop(6, () => {
            v.addAssign(a.mul(fogNoiseFn(fp)));
            // fp = rot * fp * 2.0 + vec2(1.7, 9.2)
            const rx = fp.x.mul(0.8).sub(fp.y.mul(0.6));
            const ry = fp.x.mul(0.6).add(fp.y.mul(0.8));
            fp.assign(TSL.vec2(rx, ry).mul(2.0).add(TSL.vec2(1.7, 9.2)));
            a.mulAssign(0.5);
        });
        return v;
    });

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // uv.x *= iResolution.x / iResolution.y
        const uv = TSL.vec2(rawUv.x.mul(aspect), rawUv.y);
        const st = t.mul(0.15);

        // 4 fog layers at different speeds/directions
        const f1 = fogFbmFn(uv.mul(2.5).add(TSL.vec2(st, st.mul(0.7))));
        const f2 = fogFbmFn(
            uv
                .mul(1.8)
                .add(TSL.vec2(st.negate().mul(0.8), st.mul(0.5)))
                .add(5.0),
        );
        const f3 = fogFbmFn(
            uv
                .mul(4.0)
                .add(TSL.vec2(st.mul(0.3), st.negate().mul(0.6)))
                .add(10.0),
        );
        const f4 = fogFbmFn(
            uv
                .mul(1.2)
                .add(TSL.vec2(st.mul(0.5), st.mul(0.2)))
                .add(20.0),
        );

        // fog = f1*0.35 + f2*0.3 + f3*0.15 + f4*0.2
        const fog = TSL.smoothstep(
            0.15,
            0.75,
            f1.mul(0.35).add(f2.mul(0.3)).add(f3.mul(0.15)).add(f4.mul(0.2)),
        );

        // Dual light sources
        const lx1 = TSL.float(0.5).add(
            TSL.float(0.35).mul(TSL.sin(t.mul(0.2))),
        );
        const ly1 = TSL.float(0.5).add(TSL.float(0.3).mul(TSL.sin(t.mul(0.3))));
        const lightGlow1 = TSL.exp(
            TSL.length(rawUv.sub(TSL.vec2(lx1, ly1)))
                .negate()
                .mul(2.0),
        ).mul(0.35);

        const lx2 = TSL.float(0.3).add(
            TSL.float(0.2).mul(TSL.cos(t.mul(0.15).add(2.0))),
        );
        const ly2 = TSL.float(0.4).add(
            TSL.float(0.25).mul(TSL.sin(t.mul(0.25).add(1.0))),
        );
        const lightGlow2 = TSL.exp(
            TSL.length(rawUv.sub(TSL.vec2(lx2, ly2)))
                .negate()
                .mul(2.5),
        ).mul(0.2);

        const lightGlow = lightGlow1.add(lightGlow2);

        // fogColor = mix(vec3(0.72,0.8,0.9), vec3(0.92,0.87,0.78), lightGlow)
        const fogColor = TSL.mix(
            TSL.vec3(0.72, 0.8, 0.9),
            TSL.vec3(0.92, 0.87, 0.78),
            lightGlow,
        );

        // alpha = fog*0.7 + lightGlow*fog*0.5
        const alpha = TSL.clamp(
            fog.mul(0.7).add(lightGlow.mul(fog).mul(0.5)),
            0.0,
            0.8,
        );

        // gl_FragColor = vec4(fogColor * alpha, alpha)
        return TSL.vec4(
            fogColor.x.mul(alpha),
            fogColor.y.mul(alpha),
            fogColor.z.mul(alpha),
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 21. VFog — 泡雾 (simplified port from GLSL: 2D fractal Voronoi fog)
// ============================================================
export const createVFogEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    // vfHash2(vec2) -> vec2 (matching GLSL vfHash3 pattern, 2D)
    const vfHash2 = TSL.Fn(([p]: [THREE.Node<'vec2'>]) => {
        return TSL.vec2(
            TSL.fract(
                TSL.sin(TSL.dot(p, TSL.vec2(127.1, 311.7))).mul(43758.5453),
            ),
            TSL.fract(
                TSL.sin(TSL.dot(p, TSL.vec2(269.5, 183.3))).mul(43758.5453),
            ),
        );
    });

    // 2D Voronoi (simplified from GLSL 3D vfVoronoi — 9 cells vs 27)
    const vfVoronoi = TSL.Fn(([p]: [THREE.Node<'vec2'>]) => {
        const n = TSL.floor(p);
        const f = TSL.fract(p);
        const sd = TSL.float(1.0).toVar();
        // Flat 3×3 neighborhood: offset = (i%3 - 1, floor(i/3) - 1)
        TSL.Loop(9, ({ i }) => {
            const idx = TSL.float(i);
            const ox = TSL.fract(idx.div(3.0)).mul(3.0).sub(1.0);
            const oy = TSL.floor(idx.div(3.0)).sub(1.0);
            const o = TSL.vec2(ox, oy);
            const h = vfHash2(n.add(o));
            // Animate: (o - f) + 1.0 + sin(hash * 50) * 0.2 (from GLSL)
            const r = o
                .sub(f)
                .add(1.0)
                .add(
                    TSL.vec2(
                        TSL.sin(h.x.mul(50.0)).mul(0.2),
                        TSL.sin(h.y.mul(50.0)).mul(0.2),
                    ),
                );
            const d = TSL.dot(r, r);
            sd.assign(TSL.min(sd, d));
        });
        return sd;
    });

    // Fractal Voronoi — 3 octaves (VFOG_FBM_ITER=3, freq*=1.9, amp*=0.8)
    const vfFractal = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const result = TSL.float(0.0).toVar();
        const freq = TSL.float(0.5).toVar();
        const ampV = TSL.float(0.5).toVar();
        const fp = TSL.vec2(pIn).toVar();
        TSL.Loop(3, () => {
            result.addAssign(vfVoronoi(fp.mul(freq)).mul(ampV));
            freq.mulAssign(1.9);
            ampV.mulAssign(0.8);
            // mat2(0.8, 0.6, -0.6, 0.8) rotation
            fp.assign(
                TSL.vec2(
                    fp.x.mul(0.8).sub(fp.y.mul(0.6)),
                    fp.x.mul(0.6).add(fp.y.mul(0.8)),
                ),
            );
        });
        return result;
    });

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // Aspect-correct UVs, scroll down (origin.y -= iTime * 0.2)
        const uv = TSL.vec2(
            rawUv.x.mul(aspect).mul(2.0),
            rawUv.y.mul(2.0).sub(t.mul(0.2)),
        );

        const d = vfFractal(uv).mul(0.75); // VFOG_NOISE_AMP

        // Simulate raymarching depth contribution
        const depth = d.mul(3.0).add(1.0);

        // Warm/cool color mixing (from GLSL)
        // warmColor = vec3(1.0, 0.616, 0.476) * d * depth * 0.7
        // coolColor = vec3(0.0, 0.0, 1.0)
        // mix factor = max(0.0, 0.3 - d)
        const warmColor = TSL.vec3(1.0, 0.616, 0.476)
            .mul(d)
            .mul(depth)
            .mul(0.7);
        const coolColor = TSL.vec3(0.0, 0.0, 1.0);
        const mixFactor = TSL.max(0.0, TSL.float(0.3).sub(d));
        const col = TSL.mix(warmColor, coolColor, mixFactor).toVar();

        col.assign(TSL.clamp(col, 0.0, 1.0));
        const brightness = TSL.max(col.x, TSL.max(col.y, col.z));
        const alpha = TSL.clamp(brightness.mul(2.0), 0.0, 0.9);
        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 22. Cloud — 云层 (faithful port from GLSL: Simplex noise FBM procedural clouds)
// ============================================================
export const createCloudEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const aspect = width / height;

    const CLOUDSCALE = 1.1;
    const SPEED = 0.03;
    const CLOUDDARK = 0.5;
    const CLOUDLIGHT = 0.3;
    const CLOUDCOVER = 0.2;
    const CLOUDALPHA = 8.0;
    const SKYTINT = 0.5;

    // Reuse tslNoise2D for clNoise (same simplex noise algorithm)
    const clNoise = tslNoise2D();

    // mat2 m = mat2(1.6, 1.2, -1.2, 1.6) — column-major
    // m * p = vec2(1.6*p.x - 1.2*p.y, 1.2*p.x + 1.6*p.y)
    const applyM = (px: ReturnType<typeof TSL.vec2>) =>
        TSL.vec2(
            px.x.mul(1.6).sub(px.y.mul(1.2)),
            px.x.mul(1.2).add(px.y.mul(1.6)),
        );

    // fbm(vec2 n) — 7 octaves, amplitude 0.1, decay 0.4
    const fbmFn = TSL.Fn(([nIn]: [THREE.Node<'vec2'>]) => {
        const total = TSL.float(0.0).toVar();
        const amplitude = TSL.float(0.1).toVar();
        const np = TSL.vec2(nIn).toVar();
        TSL.Loop(7, () => {
            total.addAssign(clNoise(np).mul(amplitude));
            np.assign(applyM(np));
            amplitude.mulAssign(0.4);
        });
        return total;
    });

    material.colorNode = TSL.Fn(() => {
        const p = TSL.uv();
        const uv = TSL.vec2(p.x.mul(aspect), p.y).toVar();
        const time = uniforms.time.mul(uniforms.speed).mul(SPEED).toVar();

        const q = fbmFn(uv.mul(CLOUDSCALE * 0.5));

        // ── ridged noise shape (8 octaves, abs) ──
        const r = TSL.float(0.0).toVar();
        uv.assign(uv.mul(CLOUDSCALE));
        uv.subAssign(TSL.vec2(q).sub(time));
        const rw = TSL.float(0.8).toVar();
        TSL.Loop(8, () => {
            r.addAssign(TSL.abs(rw.mul(clNoise(uv))));
            uv.assign(applyM(uv).add(time));
            rw.mulAssign(0.7);
        });

        // ── noise shape (8 octaves) ──
        const f = TSL.float(0.0).toVar();
        uv.assign(TSL.vec2(p.x.mul(aspect), p.y).mul(CLOUDSCALE));
        uv.subAssign(TSL.vec2(q).sub(time));
        const fw = TSL.float(0.7).toVar();
        TSL.Loop(8, () => {
            f.addAssign(fw.mul(clNoise(uv)));
            uv.assign(applyM(uv).add(time));
            fw.mulAssign(0.6);
        });

        f.assign(f.mul(r.add(f)));

        // ── noise colour (7 octaves) ──
        const cc = TSL.float(0.0).toVar();
        const time2 = time.mul(2.0);
        uv.assign(TSL.vec2(p.x.mul(aspect), p.y).mul(CLOUDSCALE * 2.0));
        uv.subAssign(TSL.vec2(q).sub(time2));
        const cw = TSL.float(0.4).toVar();
        TSL.Loop(7, () => {
            cc.addAssign(cw.mul(clNoise(uv)));
            uv.assign(applyM(uv).add(time2));
            cw.mulAssign(0.6);
        });

        // ── noise ridge colour (7 octaves, abs) ──
        const c1 = TSL.float(0.0).toVar();
        const time3 = time.mul(3.0);
        uv.assign(TSL.vec2(p.x.mul(aspect), p.y).mul(CLOUDSCALE * 3.0));
        uv.subAssign(TSL.vec2(q).sub(time3));
        const c1w = TSL.float(0.4).toVar();
        TSL.Loop(7, () => {
            c1.addAssign(TSL.abs(c1w.mul(clNoise(uv))));
            uv.assign(applyM(uv).add(time3));
            c1w.mulAssign(0.6);
        });

        cc.addAssign(c1);

        // Sky gradient
        const skycolour1 = TSL.vec3(0.2, 0.4, 0.6);
        const skycolour2 = TSL.vec3(0.4, 0.7, 1.0);
        const skycolour = TSL.mix(skycolour2, skycolour1, p.y);

        // Cloud colour
        const cloudcolour = TSL.vec3(1.1, 1.1, 0.9).mul(
            TSL.clamp(
                TSL.float(CLOUDDARK).add(TSL.float(CLOUDLIGHT).mul(cc)),
                0.0,
                1.0,
            ),
        );

        // f = cloudcover + cloudalpha * f * r
        f.assign(
            TSL.float(CLOUDCOVER).add(TSL.float(CLOUDALPHA).mul(f).mul(r)),
        );

        // result = mix(skycolour, clamp(skytint*skycolour + cloudcolour, 0, 1), clamp(f+cc, 0, 1))
        const cloudMask = TSL.clamp(f.add(cc), 0.0, 1.0);
        const result = TSL.mix(
            skycolour,
            TSL.clamp(skycolour.mul(SKYTINT).add(cloudcolour), 0.0, 1.0),
            cloudMask,
        );

        // alpha = clamp(0.3 + cloudMask * 0.55, 0.0, 0.85)
        const alpha = TSL.clamp(
            TSL.float(0.3).add(cloudMask.mul(0.55)),
            0.0,
            0.85,
        );

        return TSL.vec4(
            result.x,
            result.y,
            result.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 23. Sandy — 沙尘 (faithful port from GLSL: SandyWind IBN multi-depth turbulence)
// ============================================================
export const createSandyEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    const SW_MAX_DEPTH = 15;
    const SW_SPEED_FACTOR = 4.0;

    // swHash(vec2 p) -> float
    const swHash = TSL.Fn(([p]: [THREE.Node<'vec2'>]) => {
        return TSL.fract(
            TSL.sin(TSL.dot(p, TSL.vec2(127.1, 311.7))).mul(43758.5453),
        );
    });

    // swNoise(vec2 p) -> float (value noise with smoothstep)
    const swNoise = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const ix = TSL.floor(pIn.x);
        const iy = TSL.floor(pIn.y);
        const fx = TSL.fract(pIn.x);
        const fy = TSL.fract(pIn.y);
        // smoothstep: f = f * f * (3.0 - 2.0 * f)
        const sx = fx.mul(fx).mul(TSL.float(3.0).sub(fx.mul(2.0)));
        const sy = fy.mul(fy).mul(TSL.float(3.0).sub(fy.mul(2.0)));
        const a = swHash(TSL.vec2(ix, iy));
        const b = swHash(TSL.vec2(ix.add(1.0), iy));
        const c = swHash(TSL.vec2(ix, iy.add(1.0)));
        const d = swHash(TSL.vec2(ix.add(1.0), iy.add(1.0)));
        return TSL.mix(TSL.mix(a, b, sx), TSL.mix(c, d, sx), sy);
    });

    // swMotion(vec2 uv) -> vec2 (motion/displacement)
    const swMotion = TSL.Fn(([uvIn]: [THREE.Node<'vec2'>]) => {
        const u = TSL.vec2(uvIn.x.mul(4.0), uvIn.y.mul(4.0));
        return TSL.vec2(
            swNoise(u),
            swNoise(TSL.vec2(u.x.add(37.13), u.y.add(17.81))),
        );
    });

    // swColor(vec2 uv) -> vec3 (sand color texture)
    const swColor = TSL.Fn(([uvIn]: [THREE.Node<'vec2'>]) => {
        const u = TSL.vec2(uvIn.x.mul(3.0), uvIn.y.mul(3.0));
        const n1 = swNoise(u);
        const n2 = swNoise(
            TSL.vec2(u.x.mul(1.7).add(5.3), u.y.mul(1.7).add(5.3)),
        );
        const n3 = swNoise(
            TSL.vec2(u.x.mul(2.3).add(11.7), u.y.mul(2.3).add(11.7)),
        );
        const sand1 = TSL.vec3(0.95, 0.85, 0.65);
        const sand2 = TSL.vec3(0.78, 0.62, 0.42);
        const col = TSL.mix(sand1, sand2, n1).toVar();
        col.addAssign(
            TSL.vec3(
                n2.sub(0.5).mul(0.06),
                n3.sub(0.5).mul(0.06),
                n2.add(n3).mul(0.5).sub(0.5).mul(0.06),
            ),
        );
        return col;
    });

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const iTime = uniforms.time.mul(uniforms.speed);
        const speedDamping = TSL.float(SW_SPEED_FACTOR * 0.5);

        // IBN — Image-Based Noise (multi-depth turbulence)
        const color = TSL.vec3(0.0, 0.0, 0.0).toVar();
        const sumW = TSL.float(0.0).toVar();
        const md = TSL.float(SW_MAX_DEPTH);

        TSL.Loop(SW_MAX_DEPTH, ({ i }) => {
            const fi = TSL.float(i).add(1.0); // GLSL: i = 1..15
            const time = iTime.mul(0.7).div(fi);
            const w = TSL.float(1.0).sub(fi.div(md));
            const duv = swMotion(TSL.vec2(uv.x.add(time), uv.y));
            const duvX = duv.x.div(speedDamping);
            const duvY = duv.y.div(speedDamping);
            const rgb = swColor(TSL.vec2(uv.x.add(duvX), uv.y.add(duvY)));
            color.addAssign(TSL.vec3(rgb.x.mul(w), rgb.y.mul(w), rgb.z.mul(w)));
            sumW.addAssign(w);
        });

        const finalCol = TSL.vec3(
            color.x.div(sumW),
            color.y.div(sumW),
            color.z.div(sumW),
        );

        // Alpha from brightness
        const brightness = TSL.max(finalCol.x, TSL.max(finalCol.y, finalCol.z));
        const alpha = TSL.clamp(brightness.mul(1.2), 0.0, 0.75);

        return TSL.vec4(
            finalCol.x,
            finalCol.y,
            finalCol.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 24. Ocean — 海洋 (faithful port from GLSL: wave raymarching + light + bubbles)
// ============================================================
export const createOceanEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();
    const INV_W = 1.0 / width;
    const ASPECT = width / height;

    // ── oHash(vec2) → float ──
    const oHash = TSL.Fn(([p]: [THREE.Node<'vec2'>]) => {
        return TSL.sin(
            TSL.dot(p, TSL.vec2(271.319, 413.975)).add(
                p.x.mul(p.y).mul(1217.13),
            ),
        )
            .mul(0.5)
            .add(0.5);
    });

    // ── oNoise(vec2) → float (value noise with hermite) ──
    const oNoise = TSL.Fn(([pIn]: [THREE.Node<'vec2'>]) => {
        const wx = TSL.fract(pIn.x);
        const wy = TSL.fract(pIn.y);
        const fx = wx.mul(wx).mul(TSL.float(3.0).sub(wx.mul(2.0)));
        const fy = wy.mul(wy).mul(TSL.float(3.0).sub(wy.mul(2.0)));
        const bx = TSL.floor(pIn.x);
        const by = TSL.floor(pIn.y);
        return TSL.mix(
            TSL.mix(
                oHash(TSL.vec2(bx, by)),
                oHash(TSL.vec2(bx.add(1.0), by)),
                fx,
            ),
            TSL.mix(
                oHash(TSL.vec2(bx, by.add(1.0))),
                oHash(TSL.vec2(bx.add(1.0), by.add(1.0))),
                fx,
            ),
            fy,
        );
    });

    // ── map_octave(vec2) → float ──
    const mapOctave = TSL.Fn(([uvIn]: [THREE.Node<'vec2'>]) => {
        const nv = oNoise(uvIn);
        const u = TSL.vec2(
            uvIn.x.add(nv).div(2.5),
            uvIn.y.add(nv).div(2.5),
        ).toVar();
        // Rotation: vec2(u.x*0.6 - u.y*0.8, u.x*0.8 + u.y*0.6)
        u.assign(
            TSL.vec2(
                u.x.mul(0.6).sub(u.y.mul(0.8)),
                u.x.mul(0.8).add(u.y.mul(0.6)),
            ),
        );
        const usx = TSL.float(1.0).sub(TSL.abs(TSL.sin(u.x)));
        const usy = TSL.float(1.0).sub(TSL.abs(TSL.sin(u.y)));
        const ucx = TSL.abs(TSL.cos(u.x));
        const ucy = TSL.abs(TSL.cos(u.y));
        u.assign(TSL.vec2(TSL.mix(usx, ucx, usx), TSL.mix(usy, ucy, usy)));
        return TSL.float(1.0).sub(TSL.pow(u.x.mul(u.y), 0.65));
    });

    // ── oMap(vec3, float) → float (ocean surface function) ──
    const oMap = TSL.Fn(
        ([p, time]: [THREE.Node<'vec3'>, THREE.Node<'float'>]) => {
            const halfT = time.div(2.0);
            const uv1 = TSL.vec2(p.x.add(halfT), p.z.add(halfT)).toVar();
            const amp1 = TSL.float(0.6).toVar();
            const val = TSL.float(0.0).toVar();
            TSL.Loop(3, () => {
                val.addAssign(mapOctave(uv1).mul(amp1));
                amp1.mulAssign(0.3);
                uv1.mulAssign(2.0);
            });
            const uv2 = TSL.vec2(
                p.x.sub(1000.0).sub(halfT),
                p.z.sub(1000.0).sub(halfT),
            ).toVar();
            const amp2 = TSL.float(0.6).toVar();
            TSL.Loop(3, () => {
                val.addAssign(mapOctave(uv2).mul(amp2));
                amp2.mulAssign(0.3);
                uv2.mulAssign(2.0);
            });
            return val.add(3.0).sub(p.y);
        },
    );

    // ── getNormal(vec3, float) → vec3 ──
    const getNormal = TSL.Fn(
        ([p, time]: [THREE.Node<'vec3'>, THREE.Node<'float'>]) => {
            const eps = TSL.float(INV_W);
            return TSL.normalize(
                TSL.vec3(
                    oMap(TSL.vec3(p.x.add(eps), p.y, p.z), time),
                    eps,
                    oMap(TSL.vec3(p.x, p.y, p.z.add(eps)), time),
                ),
            );
        },
    );

    // ── oFbm(vec2) → float (5-octave, n+=n, amp*=0.4) ──
    const oFbm = TSL.Fn(([nIn]: [THREE.Node<'vec2'>]) => {
        const total = TSL.float(0.0).toVar();
        const amp = TSL.float(1.0).toVar();
        const n = TSL.vec2(nIn.x, nIn.y).toVar();
        TSL.Loop(5, () => {
            total.addAssign(oNoise(n).mul(amp));
            n.mulAssign(2.0);
            amp.mulAssign(0.4);
        });
        return total;
    });

    // ── lightShafts(vec2, float) → float ──
    const lightShaftsFn = TSL.Fn(
        ([stIn, time]: [THREE.Node<'vec2'>, THREE.Node<'float'>]) => {
            const cosA = Math.cos(-0.2);
            const sinA = Math.sin(-0.2);
            const tS = time.div(16.0);
            const stRot = TSL.vec2(
                stIn.x.mul(cosA).sub(stIn.y.mul(sinA)),
                stIn.x.mul(sinA).add(stIn.y.mul(cosA)),
            );
            const v1 = oFbm(
                TSL.vec2(stRot.x.mul(2.0).add(200.0).add(tS), stRot.y.div(4.0)),
            );
            const v2 = oFbm(
                TSL.vec2(stRot.x.mul(2.0).add(200.0).sub(tS), stRot.y.div(4.0)),
            );
            const val = v1.add(v2).div(3.0);
            const maskY = TSL.pow(
                TSL.clamp(
                    TSL.float(1.0).sub(TSL.abs(stIn.y.sub(0.15))),
                    0.0,
                    1.0,
                )
                    .mul(0.49)
                    .add(0.5),
                2.0,
            );
            const maskX = TSL.clamp(
                TSL.float(1.0).sub(TSL.abs(stIn.x.add(0.2))),
                0.0,
                1.0,
            )
                .mul(0.49)
                .add(0.5);
            return TSL.pow(val.mul(maskY).mul(maskX), 2.0);
        },
    );

    // ── bubble(vec2, float, float) → vec2 ──
    const bubbleFn = TSL.Fn(
        ([uvIn, scale, time]: [
            THREE.Node<'vec2'>,
            THREE.Node<'float'>,
            THREE.Node<'float'>,
        ]) => {
            const yMask = TSL.float(1.0).sub(TSL.step(0.2, uvIn.y));
            const tB = time.div(4.0);
            const st = TSL.vec2(uvIn.x.mul(scale), uvIn.y.mul(scale)).toVar();
            const cellX = TSL.floor(st.x);
            // bias = vec2(0, 4*sin(cellX*128+t))
            st.assign(
                TSL.vec2(
                    st.x,
                    st.y.add(TSL.sin(cellX.mul(128.0).add(tB)).mul(4.0)),
                ),
            );
            const bMask = TSL.smoothstep(
                0.1,
                0.2,
                TSL.cos(cellX.mul(128.0).add(tB)).negate(),
            );
            const c2x = TSL.floor(st.x);
            const c2y = TSL.floor(st.y);
            st.assign(TSL.vec2(TSL.fract(st.x), TSL.fract(st.y)));
            const size = oNoise(TSL.vec2(c2x, c2y)).mul(0.07).add(0.01);
            const posX = oNoise(TSL.vec2(tB, c2y.mul(64.1)))
                .mul(0.8)
                .add(0.1);
            const posY = TSL.float(0.5);
            const distB = TSL.length(TSL.vec2(st.x.sub(posX), st.y.sub(posY)));
            const inBub = TSL.float(1.0).sub(TSL.step(size, distB));
            return TSL.vec2(
                st.x.add(posX).mul(0.1).mul(bMask).mul(inBub).mul(yMask),
                st.y.add(posY).mul(0.2).mul(bMask).mul(inBub).mul(yMask),
            );
        },
    );

    material.colorNode = TSL.Fn(() => {
        const rawUv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        // UV: (-res + 2*fragCoord) / res.y → centered, aspect-corrected
        const uv = TSL.vec2(
            rawUv.x.mul(2.0).sub(1.0).mul(ASPECT),
            rawUv.y.mul(2.0).sub(1.0),
        ).toVar();
        // uv.y *= 0.5; uv.y -= 0.25; uv.x *= 0.45
        uv.assign(TSL.vec2(uv.x.mul(0.45), uv.y.mul(0.5).sub(0.25)));

        // Bubble distortion
        const bub1 = bubbleFn(uv, TSL.float(12.0), t);
        const bub2 = bubbleFn(uv, TSL.float(24.0), t);
        uv.addAssign(TSL.vec2(bub1.x.add(bub2.x), bub1.y.add(bub2.y)));

        const rd = TSL.normalize(TSL.vec3(uv.x, uv.y, -1.0));
        const ro = TSL.vec3(0.0, 0.0, 2.0);
        const seaColor = TSL.vec3(11.0 / 255.0, 82.0 / 255.0, 142.0 / 255.0);

        // ── Raymarch (16-iter binary search) ──
        const rmL = TSL.float(0.0).toVar();
        const rmR = TSL.float(26.0).toVar();
        const rmDist = TSL.float(1000000.0).toVar();
        TSL.Loop(16, () => {
            const mid = rmL.add(rmR).div(2.0);
            const sp = TSL.vec3(
                ro.x.add(rd.x.mul(mid)),
                ro.y.add(rd.y.mul(mid)),
                ro.z.add(rd.z.mul(mid)),
            );
            const mm = oMap(sp, t);
            rmDist.assign(TSL.min(rmDist, TSL.abs(mm)));
            // Branchless: if mapmid > 0 → l = mid, else r = mid
            const sel = TSL.step(0.0, mm);
            rmL.assign(TSL.mix(rmL, mid, sel));
            rmR.assign(TSL.mix(mid, rmR, sel));
        });
        const hitPos = TSL.vec3(
            ro.x.add(rd.x.mul(rmL)),
            ro.y.add(rd.y.mul(rmL)),
            ro.z.add(rd.z.mul(rmL)),
        );

        // ── Diffuse ──
        const normal = getNormal(hitPos, t);
        const diffuse = TSL.dot(normal, rd).mul(0.5).add(0.5);
        const color = TSL.mix(
            seaColor,
            TSL.vec3(15.0 / 255.0, 120.0 / 255.0, 152.0 / 255.0),
            diffuse,
        ).toVar();
        const diffPow12 = TSL.pow(diffuse, 12.0);
        color.addAssign(TSL.vec3(diffPow12, diffPow12, diffPow12));

        // ── Refraction ──
        // refract(hitPos - lightPos, normal, 0.05) then normalize
        const lightPos = TSL.vec3(8.0, 3.0, -3.0);
        const inc = TSL.vec3(
            hitPos.x.sub(lightPos.x),
            hitPos.y.sub(lightPos.y),
            hitPos.z.sub(lightPos.z),
        );
        const dotNI = TSL.dot(normal, inc);
        const ETA = 0.05;
        const ETA2 = ETA * ETA;
        // k = 1 - eta²*(1 - dot(N,I)²) = (1-eta²) + eta²*dot²
        const k = TSL.float(1.0 - ETA2).add(
            TSL.float(ETA2).mul(dotNI.mul(dotNI)),
        );
        const sqrtK = TSL.sqrt(TSL.max(k, 0.0));
        const coeff = dotNI.mul(ETA).add(sqrtK);
        const refDir = TSL.normalize(
            TSL.vec3(
                inc.x.mul(ETA).sub(normal.x.mul(coeff)),
                inc.y.mul(ETA).sub(normal.y.mul(coeff)),
                inc.z.mul(ETA).sub(normal.z.mul(coeff)),
            ),
        );
        const refraction = TSL.clamp(TSL.dot(refDir, rd), 0.0, 1.0);
        color.addAssign(
            TSL.vec3(245.0 / 255.0, 250.0 / 255.0, 220.0 / 255.0)
                .mul(0.6)
                .mul(TSL.pow(refraction, 1.5)),
        );

        // Mix with sea color by distance
        const col = TSL.mix(
            color,
            seaColor,
            TSL.pow(TSL.clamp(rmDist, 0.0, 1.0), 0.2),
        ).toVar();

        // Light shafts
        col.addAssign(
            TSL.vec3(225.0 / 255.0, 230.0 / 255.0, 200.0 / 255.0).mul(
                lightShaftsFn(uv, t),
            ),
        );

        // Tone map: (col*col + sin(col)) / vec3(1.8, 1.8, 1.9)
        col.assign(
            TSL.vec3(
                col.x.mul(col.x).add(TSL.sin(col.x)).div(1.8),
                col.y.mul(col.y).add(TSL.sin(col.y)).div(1.8),
                col.z.mul(col.z).add(TSL.sin(col.z)).div(1.9),
            ),
        );

        // Vignette
        const vig = TSL.float(0.7).add(
            TSL.pow(
                TSL.float(16.0)
                    .mul(rawUv.x)
                    .mul(rawUv.y)
                    .mul(TSL.float(1.0).sub(rawUv.x))
                    .mul(TSL.float(1.0).sub(rawUv.y)),
                0.2,
            ).mul(0.3),
        );
        col.assign(TSL.vec3(col.x.mul(vig), col.y.mul(vig), col.z.mul(vig)));

        const brightness = TSL.max(col.x, TSL.max(col.y, col.z));
        const alpha = TSL.clamp(brightness.mul(2.5).add(0.15), 0.0, 0.9);
        return TSL.vec4(col.x, col.y, col.z, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 25. Caustic — 水纹 (faithful port from GLSL: Water Turbulence by David Hoskins / joltz0r)
// ============================================================
export const createCausticEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    const TAU = 6.28318530718;
    const MAX_ITER = 5;

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        const time = t.mul(0.5).add(23.0);

        // p = mod(uv * TAU, TAU) - 250.0
        const uvTau = TSL.vec2(uv.x.mul(TAU), uv.y.mul(TAU));
        const p = TSL.vec2(
            uvTau.x.sub(TSL.floor(uvTau.x.div(TAU)).mul(TAU)).sub(250.0),
            uvTau.y.sub(TSL.floor(uvTau.y.div(TAU)).mul(TAU)).sub(250.0),
        );

        const ix = TSL.float(p.x).toVar();
        const iy = TSL.float(p.y).toVar();
        const c = TSL.float(1.0).toVar();
        const inten = TSL.float(0.005);

        TSL.Loop(MAX_ITER, ({ i }) => {
            const iterT = time.mul(
                TSL.float(1.0).sub(TSL.float(3.5).div(TSL.float(i).add(1.0))),
            );
            // i = p + vec2(cos(t-i.x)+sin(t+i.y), sin(t-i.y)+cos(t+i.x))
            const newIx = p.x.add(
                TSL.cos(iterT.sub(ix)).add(TSL.sin(iterT.add(iy))),
            );
            const newIy = p.y.add(
                TSL.sin(iterT.sub(iy)).add(TSL.cos(iterT.add(ix))),
            );
            ix.assign(newIx);
            iy.assign(newIy);

            // c += 1.0 / length(vec2(p.x/(sin(i.x+t)/inten), p.y/(cos(i.y+t)/inten)))
            const lx = p.x.div(TSL.sin(ix.add(iterT)).div(inten));
            const ly = p.y.div(TSL.cos(iy.add(iterT)).div(inten));
            c.addAssign(TSL.float(1.0).div(TSL.length(TSL.vec2(lx, ly))));
        });

        // c /= MAX_ITER; c = 1.17 - pow(c, 1.4)
        c.divAssign(TSL.float(MAX_ITER));
        c.assign(TSL.float(1.17).sub(TSL.pow(c, 1.4)));

        // colour = vec3(pow(abs(c), 8.0))
        const grey = TSL.pow(TSL.abs(c), 8.0);
        // colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0)
        const colour = TSL.vec3(
            TSL.clamp(grey, 0.0, 1.0),
            TSL.clamp(grey.add(0.35), 0.0, 1.0),
            TSL.clamp(grey.add(0.5), 0.0, 1.0),
        );

        const brightness = TSL.max(colour.x, TSL.max(colour.y, colour.z));
        const alpha = TSL.clamp(brightness.mul(1.5), 0.0, 0.8);
        return TSL.vec4(
            colour.x,
            colour.y,
            colour.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 26. Bonfire — 篝火 (faithful port from GLSL: 3D simplex noise fire + smoke + sparks)
// ============================================================
export const createBonfireEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    // ── Ashima Arts 3D Simplex Noise (MIT License) ──
    const bfSnoise3 = TSL.Fn(([v]: [THREE.Node<'vec3'>]) => {
        const C6 = 1.0 / 6.0;
        const C3 = 1.0 / 3.0;

        // Skew input space
        const skew = TSL.dot(v, TSL.vec3(C3));
        const i = TSL.floor(v.add(skew)).toVar();
        const unskew = TSL.dot(i, TSL.vec3(C6));
        const x0 = v.sub(i).add(unskew);

        // Simplex traversal order
        const g = TSL.vec3(
            TSL.step(x0.y, x0.x),
            TSL.step(x0.z, x0.y),
            TSL.step(x0.x, x0.z),
        );
        const l = TSL.vec3(1.0).sub(g);
        const i1 = TSL.vec3(
            TSL.min(g.x, l.z),
            TSL.min(g.y, l.x),
            TSL.min(g.z, l.y),
        );
        const i2 = TSL.vec3(
            TSL.max(g.x, l.z),
            TSL.max(g.y, l.x),
            TSL.max(g.z, l.y),
        );

        const x1 = x0.sub(i1).add(C6);
        const x2 = x0.sub(i2).add(C3);
        const x3 = x0.sub(0.5);

        // mod289(i)
        i.assign(i.sub(TSL.floor(i.mul(1.0 / 289.0)).mul(289.0)));

        // Triple permutation: permute(x) = mod289(((x*34)+1)*x)
        const pIn = TSL.vec4(i.z, i.z.add(i1.z), i.z.add(i2.z), i.z.add(1.0));
        const pp1 = pIn.mul(34.0).add(1.0).mul(pIn);
        const pe1 = pp1.sub(TSL.floor(pp1.mul(1.0 / 289.0)).mul(289.0));

        const pMid = TSL.vec4(
            pe1.x.add(i.y),
            pe1.y.add(i.y).add(i1.y),
            pe1.z.add(i.y).add(i2.y),
            pe1.w.add(i.y).add(1.0),
        );
        const pp2 = pMid.mul(34.0).add(1.0).mul(pMid);
        const pe2 = pp2.sub(TSL.floor(pp2.mul(1.0 / 289.0)).mul(289.0));

        const pOut = TSL.vec4(
            pe2.x.add(i.x),
            pe2.y.add(i.x).add(i1.x),
            pe2.z.add(i.x).add(i2.x),
            pe2.w.add(i.x).add(1.0),
        );
        const pp3 = pOut.mul(34.0).add(1.0).mul(pOut);
        const p = pp3.sub(TSL.floor(pp3.mul(1.0 / 289.0)).mul(289.0));

        // Pre-computed: ns.x = 2/7, ns.y = 0.5/7−1, ns.z = 1/7
        const NS_X = 2.0 / 7.0;
        const NS_Y = 0.5 / 7.0 - 1.0;
        const NS_Z = 1.0 / 7.0;

        const j = p.sub(TSL.floor(p.mul(NS_Z * NS_Z)).mul(49.0));
        const xg = TSL.floor(j.mul(NS_Z));
        const yg = TSL.floor(j.sub(xg.mul(7.0)));
        const xv = xg.mul(NS_X).add(NS_Y);
        const yv = yg.mul(NS_X).add(NS_Y);

        // h = 1 − |x| − |y|
        const hv = TSL.vec4(
            TSL.float(1.0).sub(TSL.abs(xv.x)).sub(TSL.abs(yv.x)),
            TSL.float(1.0).sub(TSL.abs(xv.y)).sub(TSL.abs(yv.y)),
            TSL.float(1.0).sub(TSL.abs(xv.z)).sub(TSL.abs(yv.z)),
            TSL.float(1.0).sub(TSL.abs(xv.w)).sub(TSL.abs(yv.w)),
        );

        const b0 = TSL.vec4(xv.x, xv.y, yv.x, yv.y);
        const b1 = TSL.vec4(xv.z, xv.w, yv.z, yv.w);
        const s0 = TSL.floor(b0).mul(2.0).add(1.0);
        const s1 = TSL.floor(b1).mul(2.0).add(1.0);

        const sh = TSL.vec4(
            TSL.step(hv.x, 0.0).negate(),
            TSL.step(hv.y, 0.0).negate(),
            TSL.step(hv.z, 0.0).negate(),
            TSL.step(hv.w, 0.0).negate(),
        );

        // a0 = b0.xzyw + s0.xzyw * sh.xxyy
        const a0 = TSL.vec4(
            b0.x.add(s0.x.mul(sh.x)),
            b0.z.add(s0.z.mul(sh.x)),
            b0.y.add(s0.y.mul(sh.y)),
            b0.w.add(s0.w.mul(sh.y)),
        );
        // a1 = b1.xzyw + s1.xzyw * sh.zzww
        const a1 = TSL.vec4(
            b1.x.add(s1.x.mul(sh.z)),
            b1.z.add(s1.z.mul(sh.z)),
            b1.y.add(s1.y.mul(sh.w)),
            b1.w.add(s1.w.mul(sh.w)),
        );

        // Gradient vectors + normalize
        const gp0 = TSL.vec3(a0.x, a0.y, hv.x);
        const gp1 = TSL.vec3(a0.z, a0.w, hv.y);
        const gp2 = TSL.vec3(a1.x, a1.y, hv.z);
        const gp3 = TSL.vec3(a1.z, a1.w, hv.w);

        const ng0 = gp0.mul(TSL.float(1.0).div(TSL.sqrt(TSL.dot(gp0, gp0))));
        const ng1 = gp1.mul(TSL.float(1.0).div(TSL.sqrt(TSL.dot(gp1, gp1))));
        const ng2 = gp2.mul(TSL.float(1.0).div(TSL.sqrt(TSL.dot(gp2, gp2))));
        const ng3 = gp3.mul(TSL.float(1.0).div(TSL.sqrt(TSL.dot(gp3, gp3))));

        // Kernel weights
        const m = TSL.vec4(
            TSL.max(TSL.float(0.6).sub(TSL.dot(x0, x0)), 0.0),
            TSL.max(TSL.float(0.6).sub(TSL.dot(x1, x1)), 0.0),
            TSL.max(TSL.float(0.6).sub(TSL.dot(x2, x2)), 0.0),
            TSL.max(TSL.float(0.6).sub(TSL.dot(x3, x3)), 0.0),
        );
        const m2 = m.mul(m);
        const m4 = m2.mul(m2);

        return TSL.dot(
            m4,
            TSL.vec4(
                TSL.dot(ng0, x0),
                TSL.dot(ng1, x1),
                TSL.dot(ng2, x2),
                TSL.dot(ng3, x3),
            ),
        ).mul(42.0);
    });

    // ── Noise stacks (falloff-weighted octaves) ──
    const bfNS3 = TSL.Fn(
        ([posIn, falloff]: [THREE.Node<'vec3'>, THREE.Node<'float'>]) => {
            const pos = TSL.vec3(posIn).toVar();
            const noise = bfSnoise3(pos).toVar();
            const off = TSL.float(1.0).toVar();
            pos.mulAssign(2.0);
            off.mulAssign(falloff);
            noise.assign(
                TSL.float(1.0)
                    .sub(off)
                    .mul(noise)
                    .add(off.mul(bfSnoise3(pos))),
            );
            pos.mulAssign(2.0);
            off.mulAssign(falloff);
            noise.assign(
                TSL.float(1.0)
                    .sub(off)
                    .mul(noise)
                    .add(off.mul(bfSnoise3(pos))),
            );
            return TSL.float(1.0).add(noise).div(2.0);
        },
    );

    const bfNS2 = TSL.Fn(
        ([posIn, falloff]: [THREE.Node<'vec3'>, THREE.Node<'float'>]) => {
            const pos = TSL.vec3(posIn).toVar();
            const noise = bfSnoise3(pos).toVar();
            const off = TSL.float(1.0).toVar();
            pos.mulAssign(2.0);
            off.mulAssign(falloff);
            noise.assign(
                TSL.float(1.0)
                    .sub(off)
                    .mul(noise)
                    .add(off.mul(bfSnoise3(pos))),
            );
            return TSL.float(1.0).add(noise).div(2.0);
        },
    );

    const bfNS1 = TSL.Fn(([posIn]: [THREE.Node<'vec3'>]) => {
        return TSL.float(1.0).add(bfSnoise3(posIn)).div(2.0);
    });

    // ── PRNG for sparks ──
    const bfPrng = TSL.Fn(([seedIn]: [THREE.Node<'vec2'>]) => {
        const sd = TSL.fract(seedIn.mul(TSL.vec2(5.3983, 5.4427))).toVar();
        const d = TSL.dot(
            TSL.vec2(sd.y, sd.x),
            sd.add(TSL.vec2(21.5351, 14.3137)),
        );
        sd.addAssign(d);
        return TSL.fract(sd.x.mul(sd.y).mul(95.4337));
    });

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const time = uniforms.time.mul(uniforms.speed);
        const xpart = uv.x;
        const ypart = uv.y;

        // Pixel-space calculations
        const fragCoordX = uv.x.mul(width);
        const fragCoordY = uv.y.mul(height);

        const CLIP = 210.0;
        const ypartClip = fragCoordY.div(CLIP);
        const ypartClippedFalloff = TSL.clamp(
            TSL.float(2.0).sub(ypartClip),
            0.0,
            1.0,
        );
        const ypartClipped = TSL.min(ypartClip, 1.0);
        const ypartClippedn = TSL.float(1.0).sub(ypartClipped);

        const xfuel = TSL.float(1.0).sub(TSL.abs(xpart.mul(2.0).sub(1.0)));

        const realTime = time.mul(0.5);

        // 3D position for noise sampling
        const position = TSL.vec3(
            fragCoordX.mul(0.01).add(1223.0),
            fragCoordY.mul(0.01).add(6434.0),
            TSL.float(8425.0),
        );

        // Flow field
        const flowX = TSL.float(0.5)
            .sub(xpart)
            .mul(4.1)
            .mul(TSL.pow(TSL.max(ypartClippedn, 0.0001), 4.0));
        const flowY = xfuel
            .negate()
            .mul(2.0)
            .mul(TSL.pow(TSL.max(ypartClippedn, 0.0001), 64.0));

        // Timing = realTime * vec3(0, -1.7, 1.1) + flow
        const timing = TSL.vec3(
            flowX,
            realTime.mul(-1.7).add(flowY),
            realTime.mul(1.1),
        );

        // Displacement noise
        const displacePos = TSL.vec3(
            position.x.mul(2.4).add(realTime.mul(0.01)),
            position.y.mul(1.2).add(realTime.mul(-0.7)),
            position.z.mul(2.4).add(realTime.mul(1.3)),
        );
        const dsp_a = bfNS2(displacePos, TSL.float(0.4));
        const dsp_b = bfNS2(
            displacePos.add(TSL.vec3(3984.293, 423.21, 5235.19)),
            TSL.float(0.4),
        );

        // Main noise
        const noiseCoord = TSL.vec3(
            position.x.mul(2.0).add(timing.x).add(dsp_a.mul(0.4)),
            position.y.add(timing.y).add(dsp_b.mul(0.4)),
            position.z.add(timing.z),
        );
        const noise = bfNS3(noiseCoord, TSL.float(0.4));

        // ── Fire ──
        const flameExp = xfuel.mul(0.3);
        const flames = TSL.pow(TSL.max(ypartClipped, 0.001), flameExp).mul(
            TSL.pow(TSL.max(noise, 0.001), flameExp),
        );

        const flames3 = flames.mul(flames).mul(flames);
        const f = ypartClippedFalloff.mul(
            TSL.pow(TSL.max(TSL.float(1.0).sub(flames3), 0.0), 8.0),
        );
        const fff = f.mul(f).mul(f);
        const fire = TSL.vec3(f.mul(1.5), fff.mul(1.5), fff.mul(fff).mul(1.5));

        // ── Smoke ──
        const smokePos = TSL.vec3(
            position.x.mul(0.4).add(timing.x),
            position.y.mul(0.4).add(timing.y),
            position.z.mul(0.4).add(timing.z.mul(0.2)),
        );
        const smokeNoise = TSL.float(0.5).add(bfSnoise3(smokePos).div(2.0));
        const smokeVal = TSL.pow(xfuel, 3.0)
            .mul(TSL.pow(ypart, 2.0))
            .mul(0.3)
            .mul(smokeNoise.add(TSL.float(1.0).sub(noise).mul(0.4)));
        const smoke = TSL.vec3(smokeVal);

        // ── Sparks ──
        const SPARK_GRID = 30.0;
        const sparkCoord = TSL.vec2(
            fragCoordX,
            fragCoordY.sub(realTime.mul(190.0)),
        ).toVar();

        // Noise distortion
        const spNoiseIn = TSL.vec3(
            sparkCoord.x.mul(0.01),
            sparkCoord.y.mul(0.01),
            time.mul(0.3),
        );
        const spn_a = bfNS1(spNoiseIn);
        const spn_b = bfNS1(spNoiseIn.add(TSL.vec3(3984.293, 423.21, 5235.19)));
        sparkCoord.subAssign(TSL.vec2(spn_a, spn_b).mul(30.0));

        // Flow push
        sparkCoord.addAssign(TSL.vec2(flowX, flowY).mul(100.0));

        // Hex grid offset
        const hexMod = TSL.fract(sparkCoord.y.div(SPARK_GRID * 2.0)).mul(2.0);
        const hexShift = TSL.float(1.0).sub(TSL.step(1.0, hexMod));
        sparkCoord.assign(
            TSL.vec2(
                sparkCoord.x.add(hexShift.mul(SPARK_GRID * 0.5)),
                sparkCoord.y,
            ),
        );

        // Grid index + PRNG
        const sparkGridIndex = TSL.vec2(
            TSL.floor(sparkCoord.x.div(SPARK_GRID)),
            TSL.floor(sparkCoord.y.div(SPARK_GRID)),
        );
        const sparkRandom = bfPrng(sparkGridIndex);

        // Spark life
        const sparkLifeArg = sparkGridIndex.y
            .add(realTime.mul(190.0 / SPARK_GRID))
            .div(TSL.float(24.0).sub(sparkRandom.mul(20.0)));
        const sparkLife = TSL.min(
            TSL.float(10.0).mul(TSL.float(1.0).sub(TSL.min(sparkLifeArg, 1.0))),
            1.0,
        );
        const sparkMask = TSL.step(0.001, sparkLife);

        // Spark shape
        const sparkSize = xfuel.mul(xfuel).mul(sparkRandom).mul(0.08);
        const sparkRad = sparkRandom
            .mul(999.0 * 2.0 * Math.PI)
            .add(time.mul(2.0));
        const sparkCirc = TSL.vec2(TSL.sin(sparkRad), TSL.cos(sparkRad));
        const sparkOff = TSL.float(0.5)
            .sub(sparkSize)
            .mul(SPARK_GRID)
            .mul(sparkCirc);

        // mod(sparkCoord + sparkOffset, grid) - 0.5*grid
        const scOff = sparkCoord.add(sparkOff);
        const sparkMod = TSL.vec2(
            scOff.x.sub(TSL.floor(scOff.x.div(SPARK_GRID)).mul(SPARK_GRID)),
            scOff.y.sub(TSL.floor(scOff.y.div(SPARK_GRID)).mul(SPARK_GRID)),
        ).sub(SPARK_GRID * 0.5);
        const sparkLen = TSL.length(sparkMod);
        const sparksGray = TSL.max(
            0.0,
            TSL.float(1.0).sub(
                sparkLen.div(sparkSize.mul(SPARK_GRID).add(0.001)),
            ),
        );
        const sparks = TSL.vec3(1.0, 0.3, 0.0)
            .mul(sparkLife)
            .mul(sparksGray)
            .mul(sparkMask);

        // ── Compose ──
        const result = TSL.vec3(
            TSL.max(fire.x, sparks.x).add(smoke.x),
            TSL.max(fire.y, sparks.y).add(smoke.y),
            TSL.max(fire.z, sparks.z).add(smoke.z),
        ).toVar();
        result.assign(TSL.clamp(result, 0.0, 1.0));

        const brightness = TSL.max(result.x, TSL.max(result.y, result.z));
        const alpha = TSL.clamp(brightness.mul(1.8), 0.0, 0.9);
        return TSL.vec4(
            result.x,
            result.y,
            result.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 27. Blaze — 烈焰 (faithful port from GLSL: FBM fire remix)
// ============================================================
export const createBlazeEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    // ── bzRand: hash function ──
    const bzRand = TSL.Fn(([n]: [THREE.Node<'vec2'>]) => {
        return TSL.fract(
            TSL.sin(TSL.cos(TSL.dot(n, TSL.vec2(12.9898, 12.1414)))).mul(
                83758.5453,
            ),
        );
    });

    // ── bzNoise: smoothstep-interpolated value noise ──
    const bzNoise = TSL.Fn(([n]: [THREE.Node<'vec2'>]) => {
        const b = TSL.vec2(TSL.floor(n.x), TSL.floor(n.y));
        const f = TSL.vec2(
            TSL.smoothstep(0.0, 1.0, TSL.fract(n.x)),
            TSL.smoothstep(0.0, 1.0, TSL.fract(n.y)),
        );
        // d = vec2(0,1): d.yx=(1,0), d.xy=(0,1), d.yy=(1,1)
        const r00 = bzRand(b);
        const r10 = bzRand(TSL.vec2(b.x.add(1.0), b.y));
        const r01 = bzRand(TSL.vec2(b.x, b.y.add(1.0)));
        const r11 = bzRand(TSL.vec2(b.x.add(1.0), b.y.add(1.0)));
        return TSL.mix(TSL.mix(r00, r10, f.x), TSL.mix(r01, r11, f.x), f.y);
    });

    // ── bzFbm: 5-octave FBM (n += n*1.7, amp *= 0.47) ──
    const bzFbm = TSL.Fn(([nIn]: [THREE.Node<'vec2'>]) => {
        const total = TSL.float(0.0).toVar();
        const amplitude = TSL.float(1.0).toVar();
        const n = TSL.vec2(nIn.x, nIn.y).toVar();
        TSL.Loop(5, () => {
            total.addAssign(bzNoise(n).mul(amplitude));
            n.addAssign(TSL.vec2(n.x.mul(1.7), n.y.mul(1.7)));
            amplitude.mulAssign(0.47);
        });
        return total;
    });

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);

        const dist = TSL.float(3.5).sub(TSL.sin(t.mul(0.4)).div(1.89));

        // p = fragCoord * dist / iResolution.xx (divided by width for both axes)
        const aspect = height / width;
        const p = TSL.vec2(uv.x.mul(dist), uv.y.mul(aspect).mul(dist)).toVar();

        // Domain warping
        p.addAssign(
            TSL.vec2(
                TSL.sin(p.y.mul(4.0).add(TSL.float(0.2).mul(t))),
                TSL.sin(p.x.mul(4.0).add(TSL.float(-0.3).mul(t))),
            ).mul(0.04),
        );
        p.addAssign(
            TSL.vec2(
                TSL.sin(p.y.mul(8.0).add(TSL.float(0.6).mul(t))),
                TSL.sin(p.x.mul(8.0).add(TSL.float(0.1).mul(t))),
            ).mul(0.01),
        );

        // p.x -= iTime / 1.1
        p.assign(TSL.vec2(p.x.sub(t.div(1.1)), p.y));

        // 5 FBM passes with time-varying offsets (scalar broadcast to vec2)
        const qOff = t.mul(-0.3).add(TSL.sin(t.add(0.5)).div(2.0));
        const q = TSL.float(
            bzFbm(TSL.vec2(p.x.add(qOff), p.y.add(qOff))),
        ).toVar();

        const qbOff = t.mul(-0.4).add(TSL.cos(t).mul(0.1).div(2.0));
        const qb = bzFbm(TSL.vec2(p.x.add(qbOff), p.y.add(qbOff)));

        const q2Off = t.mul(-0.44).sub(TSL.cos(t).mul(5.0).div(2.0));
        const q2 = bzFbm(TSL.vec2(p.x.add(q2Off), p.y.add(q2Off))).sub(6.0);

        const q3Off = t.mul(-0.9).sub(TSL.cos(t).mul(10.0).div(15.0));
        const q3 = bzFbm(TSL.vec2(p.x.add(q3Off), p.y.add(q3Off))).sub(4.0);

        const q4Off = t.mul(-1.4).sub(TSL.sin(t).mul(20.0).div(14.0));
        const q4 = bzFbm(TSL.vec2(p.x.add(q4Off), p.y.add(q4Off))).add(2.0);

        // q = (q + qb - 0.4*q2 - 2.0*q3 + 0.6*q4) / 3.8
        q.assign(
            q
                .add(qb)
                .sub(q2.mul(0.4))
                .sub(q3.mul(2.0))
                .add(q4.mul(0.6))
                .div(3.8),
        );

        // r = vec2(bzFbm(p + q/2 + t*0.1 - p.x - p.y), bzFbm(p + q - t*0.9))
        const rScalar = q.div(2.0).add(t.mul(0.1)).sub(p.x).sub(p.y);
        const rX = bzFbm(TSL.vec2(p.x.add(rScalar), p.y.add(rScalar)));
        const rScalar2 = q.sub(t.mul(0.9));
        const rY = bzFbm(TSL.vec2(p.x.add(rScalar2), p.y.add(rScalar2)));
        const r = TSL.vec2(rX, rY);

        // Fire color: vec3(1.0, 0.2, 0.05) / pow((r.y+r.y)*max(0,p.y)+0.1, 4.0)
        const fireDenom = TSL.pow(
            r.y.add(r.y).mul(TSL.max(0.0, p.y)).add(0.1),
            4.0,
        );
        const color = TSL.vec3(
            TSL.float(1.0).div(fireDenom),
            TSL.float(0.2).div(fireDenom),
            TSL.float(0.05).div(fireDenom),
        ).toVar();

        // Procedural texture noise (replacing iChannel0 texture)
        const texNoise = bzNoise(
            TSL.vec2(
                uv.x.mul(6.0).add(0.5).add(t.mul(0.1)),
                uv.y.mul(6.0).add(0.1).add(t.mul(0.1)),
            ),
        );
        const texPow = TSL.pow(r.y.add(r.y).mul(0.65), 5.0);
        const texBase = texNoise.mul(0.01).mul(texPow);
        color.addAssign(
            TSL.vec3(
                texBase
                    .mul(0.8)
                    .add(0.055)
                    .mul(TSL.mix(0.9, 0.7, uv.y)),
                texBase
                    .mul(0.6)
                    .add(0.055)
                    .mul(TSL.mix(0.4, 0.5, uv.y)),
                texBase
                    .mul(0.4)
                    .add(0.055)
                    .mul(TSL.mix(0.3, 0.2, uv.y)),
            ),
        );

        // Tone mapping: color / (1 + max(vec3(0), color))
        color.assign(
            TSL.vec3(
                color.x.div(TSL.float(1.0).add(TSL.max(0.0, color.x))),
                color.y.div(TSL.float(1.0).add(TSL.max(0.0, color.y))),
                color.z.div(TSL.float(1.0).add(TSL.max(0.0, color.z))),
            ),
        );

        const brightness = TSL.max(color.x, TSL.max(color.y, color.z));
        const alpha = TSL.clamp(brightness.mul(2.5), 0.0, 0.9);
        return TSL.vec4(
            color.x,
            color.y,
            color.z,
            alpha.mul(uniforms.intensity),
        );
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// 28. VHS — VHS 滤镜
// ============================================================
export const createVhsEffectMesh = (
    width: number,
    height: number,
): EffectMesh => {
    const { geometry, material } = createEffectGeometryAndMaterial(
        width,
        height,
    );
    const uniforms = createBaseUniforms();

    material.colorNode = TSL.Fn(() => {
        const uv = TSL.uv();
        const t = uniforms.time.mul(uniforms.speed);
        const rand = tslRand();

        const alpha = TSL.float(0.0).toVar();

        // Scanlines
        const scanline = TSL.sin(uv.y.mul(800.0).add(t.mul(5.0)))
            .mul(0.5)
            .add(0.5);
        alpha.addAssign(scanline.mul(0.08));

        // Random noise grain
        const grain = rand(
            TSL.vec2(
                uv.x.add(TSL.fract(t.mul(17.0))),
                uv.y.add(TSL.fract(t.mul(23.0))),
            ),
        );
        alpha.addAssign(grain.mul(0.06));

        // Horizontal flicker bands
        const flickerBand = rand(
            TSL.vec2(TSL.floor(uv.y.mul(30.0)), TSL.floor(t.mul(8.0))),
        );
        TSL.If(flickerBand.greaterThan(0.92), () => {
            alpha.addAssign(0.15);
        });

        // Horizontal tear lines
        const tearY = TSL.fract(t.mul(2.3)).mul(0.8).add(0.1);
        const tearDist = TSL.abs(uv.y.sub(tearY));
        const tear = TSL.smoothstep(0.01, 0.0, tearDist).mul(0.3);
        alpha.addAssign(tear);

        // Vignette
        const vignetteStrength = TSL.smoothstep(
            0.3,
            0.7,
            TSL.distance(uv, TSL.vec2(0.5)),
        ).mul(0.1);
        alpha.addAssign(vignetteStrength);

        alpha.assign(TSL.clamp(alpha, 0.0, 0.5));
        return TSL.vec4(0.0, 0.0, 0.0, alpha.mul(uniforms.intensity));
    })();

    const mesh = finalizeEffectMesh(geometry, material);
    return { mesh, uniforms };
};

// ============================================================
// Aggregate functions
// ============================================================

export const createAllEffectMeshes = (
    width: number,
    height: number,
): AllEffectMeshes => ({
    rain: createRainEffectMesh(width, height),
    storm: createStormEffectMesh(width, height),
    srain: createSlantRainEffectMesh(width, height),
    fire: createFireEffectMesh(width, height),
    lightning: createLightningEffectMesh(width, height),
    arc: createArcEffectMesh(width, height),
    snow: createSnowEffectMesh(width, height),
    blizzard: createBlizzardEffectMesh(width, height),
    crystal: createCrystalEffectMesh(width, height),
    embers: createEmbersEffectMesh(width, height),
    fireworks: createFireworksEffectMesh(width, height),
    bokeh: createBokehEffectMesh(width, height),
    heartbeat: createHeartbeatEffectMesh(width, height),
    intoyou: createIntoYouEffectMesh(width, height),
    stars: createStarsEffectMesh(width, height),
    nebula: createNebulaEffectMesh(width, height),
    flare: createFlareEffectMesh(width, height),
    laser: createLaserEffectMesh(width, height),
    pulse: createPulseEffectMesh(width, height),
    fog: createFogEffectMesh(width, height),
    vfog: createVFogEffectMesh(width, height),
    cloud: createCloudEffectMesh(width, height),
    sandy: createSandyEffectMesh(width, height),
    ocean: createOceanEffectMesh(width, height),
    caustic: createCausticEffectMesh(width, height),
    bonfire: createBonfireEffectMesh(width, height),
    blaze: createBlazeEffectMesh(width, height),
    vhs: createVhsEffectMesh(width, height),
});

export const addAllEffectMeshesToScene = (
    scene: THREE.Scene,
    meshes: AllEffectMeshes,
) => {
    for (const effect of Object.values(meshes)) {
        scene.add((effect as EffectMesh).mesh);
    }
};

export const updateAllEffectTimes = (
    meshes: AllEffectMeshes,
    deltaSec: number,
) => {
    for (const effect of Object.values(meshes)) {
        (effect as EffectMesh).uniforms.time.value += deltaSec;
    }
};

export const disposeAllEffectMeshes = (
    scene: THREE.Scene,
    meshes: AllEffectMeshes,
) => {
    for (const effect of Object.values(meshes)) {
        const e = effect as EffectMesh;
        scene.remove(e.mesh);
        e.mesh.geometry.dispose();
        (e.mesh.material as THREE.MeshBasicNodeMaterial).dispose();
    }
};
