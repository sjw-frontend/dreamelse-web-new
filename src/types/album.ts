// @ts-nocheck
import type {
    Album,
    AlbumRef,
    Asset,
    AssetInfo,
    AssetRef,
    PagedInfo,
} from 'expo-media-library';
import type { VideoThumbnailsResult } from 'expo-video-thumbnails';

import type { FileTypes } from './file';
import type { StyleTypes } from './style';

// TODO 重新整理
export declare namespace AlbumTypes {
    type NativeAlbum = Readonly<Album>;
    type NativeAlbumRef = Readonly<AlbumRef>;
    type NativeAsset = Readonly<Asset>;
    type NativeAssetRef = Readonly<AssetRef>;
    type NativeAssetInfo = LibTypes.Define<
        AssetInfo & {
            isCopy?: boolean,
        }
    >;
    type NativeAssetInfoCopy = LibTypes.SetRequired<
        LibTypes.SetFieldType<NativeAssetInfo, 'isCopy', true>,
        'isCopy' | 'localUri'
    >;
    type NativeAlbumPagedInfo<T extends NativeAsset = NativeAsset> = Readonly<
        PagedInfo<T>
    >;

    type VideoAssetInfo = LibTypes.FrozenDefine<{
        video: FileTypes.VideoDetails,
        thumbnail: {
            frames: LibTypes.Arr<VideoThumbnailsResult>,
            length: number,
            progressDimensions: StyleTypes.Dimensions,
        },
    }>;
}
