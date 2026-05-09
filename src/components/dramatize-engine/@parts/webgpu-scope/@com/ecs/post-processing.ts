/* eslint-disable */
import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';

export type PostProcessingSetup = LibTypes.VarDefine<{
    postProcessing: THREE.RenderPipeline;
    colorUniform: THREE.UniformNode<'color', THREE.Color>;
    alphaUniform: THREE.UniformNode<'float', number>;
    blurStrengthUniform: THREE.UniformNode<'float', number>;
    brightnessUniform: THREE.UniformNode<'float', number>;
    sharpnessUniform: THREE.UniformNode<'float', number>;
}>;

export const createPostProcessing = (
    renderer: THREE.WebGPURenderer,
    scene: THREE.Scene,
    camera: THREE.OrthographicCamera,
): PostProcessingSetup => {
    const colorUniform = TSL.uniform(new THREE.Color(1, 1, 1));
    const alphaUniform = TSL.uniform(1.0);
    const blurStrengthUniform = TSL.uniform(0.0015);
    const brightnessUniform = TSL.uniform(1.0);
    const sharpnessUniform = TSL.uniform(0.0);

    const scenePass = TSL.pass(scene, camera);
    const sceneTexture =
        scenePass.getTextureNode() as unknown as THREE.TextureNode;
    const uvNode = TSL.uv();

    const colorPass = (uv: THREE.Node) => {
        const sample = sceneTexture.sample(uv);
        return TSL.vec4(sample.rgb.mul(colorUniform), sample.a);
    };

    const blurPass = TSL.Fn(() => {
        let result = TSL.vec4(0.0);
        let total = TSL.float(0.0);

        // 7x7 kernel blur
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                const offset = TSL.mul(TSL.vec2(x, y), blurStrengthUniform);

                const sampleUV = TSL.add(uvNode, offset);

                result.assign(TSL.add(result, colorPass(sampleUV)));
                total.assign(TSL.add(total, 1.0));
            }
        }

        // 5. 将 .div() 改为 TSL.div()
        return TSL.div(result, total);
    })();

    const brightnessPass = TSL.vec4(
        blurPass.rgb.mul(brightnessUniform),
        blurPass.a,
    );

    // Sharpen using direct scene texture samples for neighbors (no re-blur).
    // Center uses the full blur+brightness pipeline; neighbors use lightweight
    // color-corrected scene samples with brightness applied.
    // This reduces per-pixel texture fetches from 441 to 49 + 8 = 57.
    const sharpenPass = TSL.Fn(() => {
        const texelSize = TSL.vec2(1.0).div(
            TSL.vec2(TSL.textureSize(sceneTexture, TSL.int(0))),
        );

        const sampleNeighbor = (offset: THREE.Node<'vec2'>) => {
            const sampled = colorPass(TSL.add(uvNode, offset));
            return TSL.vec4(sampled.rgb.mul(brightnessUniform), sampled.a);
        };

        const center = brightnessPass;
        const top = sampleNeighbor(TSL.vec2(0.0, texelSize.y));
        const bottom = sampleNeighbor(TSL.vec2(0.0, texelSize.y.negate()));
        const left = sampleNeighbor(TSL.vec2(texelSize.x.negate(), 0.0));
        const right = sampleNeighbor(TSL.vec2(texelSize.x, 0.0));

        const neighbors = top.add(bottom).add(left).add(right);

        const sharpnessWeight = sharpnessUniform.mul(4.0);
        const result = center
            .mul(TSL.float(1.0).add(sharpnessWeight))
            .sub(neighbors.mul(sharpnessUniform));

        return result;
    })();

    const finalPass = TSL.vec4(sharpenPass.rgb.mul(alphaUniform), alphaUniform);

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = finalPass;

    return {
        postProcessing,
        colorUniform,
        alphaUniform,
        blurStrengthUniform,
        brightnessUniform,
        sharpnessUniform,
    };
};
