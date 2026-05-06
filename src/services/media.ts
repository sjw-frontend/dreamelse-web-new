// @ts-nocheck
import {
    type ImagePickerOptions,
    launchImageLibraryAsync,
} from 'expo-image-picker';

import { BaseService, service } from '$/core';
import { FileEnums } from '$/enums';
import type { FileTypes } from '$/types';

import { PermissionService } from './permission';

// type VideoCropOptions = LibTypes.Define<
//     LibTypes.DefineOmit<CropOptions, 'timeRange'> & {
//         timeRange?: {
//             startMS: number,
//             endMS: number,
//         },
//     }
// >;

// type ImageCropOptions = LibTypes.DefinePick<CropOptions, 'targetSize'> &
//     Required<LibTypes.DefinePick<CropOptions, 'inputPath' | 'region'>>;

@service()
export class MediaService extends BaseService {
    public constructor(permissionService: PermissionService) {
        super();
        this.#permissionService = permissionService;
    }

    readonly #permissionService;

    // public readonly prefetchImage = ExpoImage.prefetch.bind(ExpoImage);

    // public readonly getImageMetaData = getImageMetaData;

    // public readonly getNativeAssetInfo = async (
    //     ...args: Parameters<typeof getAssetInfoAsync>
    // ): Promise<AlbumTypes.NativeAssetInfo> => getAssetInfoAsync(...args);

    // public readonly getNativeAssetInfoCopy = async (
    //     asset: AlbumTypes.NativeAssetInfo,
    // ): Promise<AlbumTypes.NativeAssetInfoCopy> => {
    //     if (asset.localUri != null && asset.isCopy) {
    //         return {
    //             ...asset,
    //             localUri: asset.localUri,
    //             isCopy: asset.isCopy,
    //         };
    //     }

    //     const assetInfo = await this.getNativeAssetInfo(asset);

    //     if (assetInfo.localUri == null) {
    //         throw new AppError('获取localUri失败');
    //     }

    //     const copyFile = this.#fileService.copy(assetInfo.localUri);

    //     if (!copyFile.exists) {
    //         throw new AppError('copy asset失败');
    //     }

    //     return {
    //         ...assetInfo,
    //         localUri: copyFile.uri,
    //         isCopy: true,
    //     };
    // };

    public readonly launchMediaLibrary = async (
        options?: ImagePickerOptions,
    ) => {
        const permissions = await this.#permissionService.getMediaPermissions();
        if (permissions.granted) {
            const result = await launchImageLibraryAsync(options);
            return result;
        }

        return null;
    };

    public readonly pickImage = async () => {
        const result = await this.launchMediaLibrary({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 1,
        });

        if (!result?.canceled && result?.assets[0]) {
            const img = result.assets[0];

            const imageInfo: FileTypes.ImageInfo = {
                kind: FileEnums.Media.Image,
                width: img.width,
                height: img.height,
                uri: img.uri,
            };

            return imageInfo;
        }

        return null;
    };

    // public readonly compressImage = async (
    //     image: FileTypes.VisualDimensionsSource,
    //     compressWidth: number,
    // ) => {
    //     try {
    //         const compressedFile = await Image.compress(image.uri, {
    //             compressionMethod: 'auto',
    //             maxWidth: compressWidth,
    //             quality: 1,
    //         });
    //         const asset = await getImageMetaData(compressedFile);

    //         const result: FileTypes.VisualInfo = {
    //             kind: FileEnums.Visual.Image,
    //             uri: compressedFile,
    //             height: asset.ImageHeight,
    //             width: asset.ImageWidth,
    //         };

    //         return result;
    //     } catch {
    //         const result: FileTypes.VisualInfo = {
    //             ...image,
    //             kind: FileEnums.Visual.Image,
    //         };

    //         return result;
    //     }
    // };

    // public readonly compressVideo = async (
    //     video: FileTypes.VideoInfo,
    //     maxSize: number,
    // ) => {
    //     try {
    //         const compressedFile = await Video.compress(video.uri, {
    //             compressionMethod: 'auto',
    //             maxSize,
    //         });
    //         const asset = await getVideoMetaData(compressedFile);

    //         const result: FileTypes.VisualInfo = {
    //             kind: FileEnums.Visual.Video,
    //             uri: compressedFile,
    //             height: asset.height,
    //             width: asset.width,
    //             durationMS: MathUtils.s2ms(asset.duration),
    //         };

    //         return result;
    //     } catch {
    //         return video;
    //     }
    // };

    // public readonly download = async (uri: FileTypes.Uri) => {
    //     const file = await this.#fileService.download(uri);
    //     const permissions = await this.#permissionService.getMediaPermissions();
    //     if (permissions.granted && file.exists) {
    //         const asset = await createAssetAsync(file.uri);
    //         return asset;
    //     }

    //     return null;
    // };

    // public readonly downloadWithEndingVideo = async (uri: FileTypes.Uri) => {
    //     const originExportVideo = await this.#fileService.download(uri);

    //     if (!originExportVideo.exists) {
    //         throw new AppError('导出视频下载失败');
    //     }

    //     const mainUri = originExportVideo.uri;

    //     const overlayVideoPath = await Asset.fromModule(
    //         ASSETS.Common.endOfVideo,
    //     ).downloadAsync();

    //     const localUri = overlayVideoPath.localUri;

    //     if (StringUtils.isEmpty(localUri)) {
    //         throw new AppError('获取结束水印视频失败');
    //     }

    //     const resultVideo = await VideoEditor.concatWithOverlay({
    //         mainVideoPath: mainUri.replace(/^file:\/\//, ''),
    //         overlayVideoPath: localUri.replace(/^file:\/\//, ''),
    //     });

    //     const permissions = await this.#permissionService.getMediaPermissions();
    //     if (permissions.granted) {
    //         const asset = await createAssetAsync(resultVideo.uri);
    //         return asset;
    //     }
    //     return null;
    // };

    // public readonly downloadGif = async (
    //     uri: FileTypes.Uri,
    //     options: LibTypes.Define<{
    //         duration: number,
    //         width: number,
    //         frameRate: number,
    //         startMS: number,
    //     }>,
    // ) => {
    //     const downloadResult = await this.#fileService.download(uri);
    //     if (!downloadResult.exists) {
    //         throw new AppError('导出视频下载失败');
    //     }

    //     try {
    //         const gifResult: VideoToGifResult =
    //             await VideoEditor.convertVideoToGif({
    //                 inputPath: downloadResult.uri.replace(/^file:\/\//, ''),
    //                 ...options,
    //             });

    //         const permissions =
    //             await this.#permissionService.getMediaPermissions();
    //         if (permissions.granted) {
    //             const asset = await createAssetAsync(gifResult.uri);
    //             return asset;
    //         }
    //         return null;
    //     } catch (error) {
    //         throw new AppError('GIF生成失败');
    //     }
    // };

    // public readonly getNativeAlbums = async (options?: AlbumsOptions) => {
    //     const permissions = await this.#permissionService.getMediaPermissions();
    //     if (permissions.granted) {
    //         return getAlbumsAsync(options);
    //     }

    //     return null;
    // };

    // public readonly getNativeAssets = async (options?: AssetsOptions) => {
    //     const permissions = await this.#permissionService.getMediaPermissions();
    //     if (permissions.granted) {
    //         return getAssetsAsync(options);
    //     }

    //     return null;
    // };

    // public readonly cropImage = async (options: ImageCropOptions) => {
    //     const { inputPath, region, targetSize } = options;

    //     return ImageEditor.cropImage(inputPath, {
    //         offset: region,
    //         size: region,
    //         displaySize: targetSize,
    //     });
    // };

    // public readonly cropImageWithBase64 = async (options: ImageCropOptions) => {
    //     const { inputPath, region, targetSize } = options;

    //     return ImageEditor.cropImage(inputPath, {
    //         offset: region,
    //         size: region,
    //         displaySize: targetSize,
    //         includeBase64: true,
    //     });
    // };

    // public readonly convertBase64ToImage = async (base64: string) =>
    //     (await ImageManipulator.manipulate(base64).renderAsync()).saveAsync();

    // public readonly cropVideo = async (options: VideoCropOptions) => {
    //     const timeRange: CropOptions['timeRange'] = options.timeRange && {
    //         start: MathUtils.ms2s(options.timeRange.startMS),
    //         end: MathUtils.ms2s(options.timeRange.endMS),
    //     };

    //     const result = await VideoEditor.crop({
    //         ...options,
    //         timeRange,
    //         inputPath:
    //             options.inputPath.replace(/^file:\/\//, '').split('#')[0] ?? '',
    //     });

    //     return {
    //         ...result,
    //         durationMS: MathUtils.s2ms(result.duration),
    //     };
    // };

    // public readonly getVisualInfoFromNativeAsset = async <
    //     T extends FileEnums.Visual,
    // >(
    //     kind: T,
    //     asset: AlbumTypes.NativeAssetInfo,
    // ) => {
    //     type Result = T extends FileEnums.Visual.Image
    //         ? FileTypes.ImageInfo
    //         : FileTypes.VideoInfo;

    //     if (kind === FileEnums.Visual.Image && asset.mediaType !== 'photo') {
    //         throw new AppError('mediaType异常');
    //     }
    //     if (kind === FileEnums.Visual.Video && asset.mediaType !== 'video') {
    //         throw new AppError('mediaType异常');
    //     }

    //     switch (kind) {
    //         case FileEnums.Visual.Image: {
    //             const assetInfo = await this.getNativeAssetInfo(asset);

    //             if (assetInfo.localUri == null) {
    //                 throw new AppError('获取localUri失败');
    //             }

    //             const result = {
    //                 kind: FileEnums.Visual.Image,
    //                 uri: assetInfo.localUri,
    //                 width: assetInfo.width,
    //                 height: assetInfo.height,
    //             };

    //             // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    //             return result as Result;
    //         }
    //         case FileEnums.Visual.Video: {
    //             // phAssetUri is a special URI for iOS PHAssets
    //             const localUri = asset.uri.startsWith('ph://')
    //                 ? await MediaCache.downloadPHVideoAsset(asset.uri)
    //                 : asset.uri;

    //             const result = {
    //                 kind: FileEnums.Visual.Video,
    //                 uri: localUri,
    //                 width: asset.width,
    //                 height: asset.height,
    //                 durationMS: MathUtils.s2ms(asset.duration),
    //             };
    //             // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    //             return result as Result;
    //         }
    //     }
    // };

    // public readonly getVideoThumbnail = async <
    //     T extends LibTypes.Arrayable<number> | undefined = undefined,
    // >(
    //     sourceUri: FileTypes.Uri,
    //     timeMS?: T,
    // ) => {
    //     type Result = T extends LibTypes.Arr
    //         ? LibTypes.Arr<VideoThumbnailsResult>
    //         : VideoThumbnailsResult | null;

    //     const timesMSList: LibTypes.Arr<number> =
    //         timeMS instanceof Array ? timeMS : [timeMS ?? 0];

    //     const result = await Promise.all(
    //         timesMSList.map<Promise<VideoThumbnailsResult>>(async time => {
    //             const options: VideoThumbnailsOptions = { time };

    //             try {
    //                 return await getThumbnailAsync(sourceUri, options);
    //             } catch {
    //                 throw new AppError('生成Thumbnail失败');
    //             }
    //         }),
    //     );

    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    //     return (
    //         timeMS instanceof Array ? result : (result[0] ?? null)
    //     ) as Result;
    // };

    // public readonly uploadProtectedVisual = async (
    //     visualInfo: FileTypes.SimpleVisualInfo,
    // ) => {
    //     const fileName = FileUtils.createFilenameByUri(visualInfo.uri);
    //     const credentials =
    //         await this.#apiService.call.video.getUploadCredentials({
    //             fileName,
    //             uploadType: visualInfo.kind,
    //         });

    //     return this.#fileService.upload(visualInfo.uri, fileName, credentials, {
    //         dimensions: visualInfo,
    //     });
    // };
}
