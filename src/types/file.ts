// @ts-nocheck
import type { VideoSource } from 'expo-video';
import type { AnimationObject } from 'lottie-react-native';

import type { FileEnums } from '$/enums';
import type { ApiTypes } from '$/types';

import type { FetchTypes } from './fetch';
import type { StyleTypes } from './style';

// TODO 重新整理
export declare namespace FileTypes {
    type Uri = string;

    type SimpleSource = LibTypes.FrozenDefine<{
        uri: Uri,
    }>;

    type UploadAssetFields = LibTypes.FrozenDefine<{
        uploadResult: UploadResult,
    }>;

    type RequireMediaAsset = number;
    type RequireLottieAsset = AnimationObject;

    type VideoAsset = LibTypes.VarPick<
        LibTypes.Reference & VideoSource,
        'contentType' | 'headers' | 'uri'
    >;

    type RequireMediaAssetRecord = LibTypes.FrozenGeneralObj<
        RequireMediaAsset,
        string
    >;
    type RequireLottieAssetRecord = LibTypes.FrozenGeneralObj<
        RequireLottieAsset,
        string
    >;

    type SimpleVisual = LibTypes.Simplify<SimpleSource & StyleTypes.Dimensions>;

    type SimpleAudio = LibTypes.FrozenDefine<
        SimpleSource & {
            /** ms */
            durationMS: number,
        }
    >;

    type BaseVisualInfoFields<T extends FileEnums.Media = FileEnums.Media> =
        LibTypes.Define<{
            kind: T,
        }>;

    type ImageFaceInfo = LibTypes.FrozenDefine<{
        leftTop: StyleTypes.Coordinate,
        rightBottom: StyleTypes.Coordinate,
    }>;

    type AudioInfo = LibTypes.Simplify<
        BaseVisualInfoFields<FileEnums.Media.Audio> & SimpleAudio
    >;
    type ImageInfo = LibTypes.Simplify<
        BaseVisualInfoFields<FileEnums.Media.Image> &
            LibTypes.FrozenDefine<{
                backgroundColor?: string,
                face?: ImageFaceInfo,
            }> &
            SimpleVisual
    >;
    type VideoInfo = LibTypes.Simplify<
        BaseVisualInfoFields<FileEnums.Media.Video> & SimpleVisual
    >;

    type VisualInfo = ImageInfo | VideoInfo;

    type ImageDetails = ImageInfo;
    type VideoDetails = LibTypes.Define<
        VideoInfo & {
            /** ms */
            durationMS: number,
        }
    >;

    type UploadedImageDetails = LibTypes.FrozenDefine<
        ImageDetails & UploadAssetFields
    >;
    type UploadedVideoDetails = LibTypes.FrozenDefine<
        UploadAssetFields & VideoDetails
    >;

    type UploadedVisualDetails = UploadedImageDetails | UploadedVideoDetails;
    type VisualDetails = ImageDetails | VideoDetails;

    type VideoDetailsWithThumbnail = LibTypes.FrozenDefine<
        VideoDetails & {
            thumbnail: SimpleVisual,
            thumbnailTimeMS: number,
        }
    >;

    type UploadedVideoDetailsWithThumbnail = LibTypes.FrozenDefine<
        UploadAssetFields &
            VideoDetailsWithThumbnail & {
                thumbnailUploadResult: UploadResult,
            }
    >;

    type UploadResult<T extends FetchTypes.ResData = FetchTypes.ResData> =
        LibTypes.FrozenDefine<{
            uploadId: string,
            data: T,
        }>;

    type ImageResource = LibTypes.FrozenDefine<
        ImageInfo & {
            id: string,
            astcUri?: string,
            remote?: {
                uri: string,
                astcUri?: string,
            },
            local?: {
                get uri(): string | null,
                astcUri?: string,
            },
        }
    >;

    type AudioResource = LibTypes.FrozenDefine<
        AudioInfo & {
            id: string,
            remote?: {
                uri: string,
            },
            local?: {
                get uri(): string | null,
            },
        }
    >;

    type Resource = AudioResource | ImageResource;

    type RawResource = LibTypes.FrozenDefine<{
        localUri: string,
    }>;
}

export declare namespace FileTypes {
    type ApiInfo = ApiTypes.Protocol.Media;
}
