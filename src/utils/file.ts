import { FileEnums } from '$/enums';
import type { FileTypes, StyleTypes } from '$/types';

import { randomIntValue } from './math';
import { isEmpty } from './string';

export const isLocalUri = (uri: LibTypes.Nullable<string>) =>
    !!uri?.trim().toLowerCase().startsWith('file://');

export const getExtension = (filePath: string) => {
    const result = filePath.split('.');
    const last = result.length > 1 ? result.at(-1) : null;
    const ext = last?.split('?')[0]?.split('#')[0];
    return !isEmpty(ext) ? (`.${ext}` as const) : '';
};

let idx = 0;
export const createFilenameByUri = (uri: FileTypes.Uri) => {
    const ext = getExtension(uri);
    return `${idx++}${randomIntValue()}${ext}`;
};

export const createFilenameById = (id: string, uri: FileTypes.Uri) => {
    const ext = getExtension(uri);
    return `${id}${ext}`;
};

export const calcMediaCoverRegion = ({
    width,
    height,
    containerWidth,
    containerHeight,
}: LibTypes.FrozenDefine<{
    width: number,
    height: number,
    containerWidth: number,
    containerHeight: number,
}>) => {
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const scale = Math.max(scaleX, scaleY);

    const croppedWidth = containerWidth / scale;
    const croppedHeight = containerHeight / scale;

    return {
        width: croppedWidth,
        height: croppedHeight,
    };
};

export const calcUploadVideoDimensions = (
    width: number,
    height: number,
    targetArea: number,
) => {
    const inputArea = width * height;

    const areaRatio = targetArea / inputArea;
    const dimensionRatio = Math.sqrt(areaRatio);

    return {
        width: Math.ceil(width * dimensionRatio),
        height: Math.ceil(height * dimensionRatio),
    };
};

export const getImageInfoFromApiInfo = <
    T extends LibTypes.Nullable<FileTypes.ApiInfo>,
>(
    apiInfo: T,
) => {
    let result: FileTypes.ImageInfo | null = null;

    if (apiInfo) {
        result = {
            kind: FileEnums.Media.Image,
            uri: apiInfo.url,
            width: apiInfo.width ?? 0,
            height: apiInfo.height ?? 0,
            face: apiInfo.face && {
                leftTop: apiInfo.face.left_top,
                rightBottom: apiInfo.face.right_bottom,
            },
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return result as T extends FileTypes.ApiInfo ? FileTypes.ImageInfo : null;
};

export const getAudioInfoFromApiInfo = <
    T extends LibTypes.Nullable<FileTypes.ApiInfo>,
>(
    apiInfo: T,
) => {
    let result: FileTypes.AudioInfo | null = null;

    if (apiInfo) {
        result = {
            kind: FileEnums.Media.Audio,
            uri: apiInfo.url,
            durationMS: apiInfo.duration ?? 0,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return result as T extends FileTypes.ApiInfo ? FileTypes.AudioInfo : null;
};

export const getImageFaceInfo = (
    image: FileTypes.ImageInfo,
    inpurtRect: Partial<StyleTypes.Rect>,
    force = false,
) => {
    const face: FileTypes.ImageFaceInfo = image.face ?? {
        leftTop: {
            x: 0,
            y: 0,
        },
        rightBottom: {
            x: image.width,
            y: image.height * 0.5,
        },
    };
    const rect: Partial<StyleTypes.Rect> =
        image.face || force
            ? inpurtRect
            : {
                  left: 0,
                  right: 0,
                  top: 0,
              };
    return {
        face,
        rect,
    };
};
