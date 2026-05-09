import * as THREE from 'three/webgpu';

export {
    // createTexture,
    type UberMesh,
    createMesh,
    type FilmFilterMesh,
    createFilmFilterMesh,
    type SurroundingDarkMesh,
    createSurroundingDarkMesh,
    disposeEffectMesh,
    createCamera,
} from './render-base';

export const createTexture = (imageBitmap: ImageBitmap): THREE.Texture => {
    const texture = new THREE.Texture(imageBitmap);
    texture.flipY = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
};
