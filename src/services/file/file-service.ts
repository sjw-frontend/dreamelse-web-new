// @ts-nocheck
import { fetch } from 'expo/fetch';
import { Directory, File, Paths } from 'expo-file-system';

import { APP } from '$/consts';
import { BaseService, service } from '$/core';
import { ApiEnums, FetchEnums } from '$/enums';
import {
    FetchError,
    RequestError,
    RequestParseJSONError,
    UploadError,
} from '$/errors';
import type { ApiTypes, FetchTypes, FileTypes, StyleTypes } from '$/types';
import { ErrUtils, FileUtils, StringUtils } from '$/utils';

import { downloadManager } from './@managers';
import { Settings } from './file-const';

type CreateFileParams = ConstructorParameters<typeof File>;

type FileParams = CreateFileParams | File | string;

@service()
export class FileService extends BaseService {
    public constructor() {
        super();

        // const dir1 = new Directory(Paths.document);
        // const dir2 = new Directory(Paths.cache);

        // dir1.list().forEach(f => {
        //     console.log('fff1', f);
        //     try {
        //         f.delete();
        //     } catch {}
        // });
        // dir2.list().forEach(f => {
        //     console.log('fff2', f);
        //     try {
        //         f.delete();
        //     } catch {}
        // });
    }

    #resourceId = -1;

    readonly #ResourceDir = new Directory(
        Paths.document,
        `${Settings.resourceDirName}-${APP.ENV.Name}`.toLowerCase(),
    );

    readonly #ResourceCacheDir = new Directory(
        Paths.cache,
        `${Settings.resourceDirName}-${APP.ENV.Name}`.toLowerCase(),
    );

    #getFile(fileParams: CreateFileParams | File | string) {
        // TODO 加缓存

        if (fileParams instanceof File) {
            return fileParams;
        }
        if (fileParams instanceof Array) {
            return this.createFile(...fileParams);
        }

        return this.createFile(fileParams);
    }

    public readonly createFile = (...args: CreateFileParams) =>
        new File(...args);

    public readonly getInfo = (fileParams: FileParams) =>
        this.#getFile(fileParams).info();

    public readonly delete = (fileParams: FileParams) =>
        this.#getFile(fileParams).delete();

    public readonly upload = async <T extends FetchTypes.ResData>(
        fileParams: FileParams,
        fileName: string,
        credentials: ApiTypes.Protocol.GetUploadCredentialsRes,
        options: LibTypes.FrozenDefine<{
            dimensions?: StyleTypes.Dimensions,
        }> = {},
    ): Promise<FileTypes.UploadResult<T>> => {
        const { dimensions } = options;

        const headers: FetchTypes.Headers = {
            success_action_status: FetchEnums.StatusCode.Success.toString(),
            policy: credentials.policy,
            callback: credentials.callback,
            key: `${credentials.dir}/${fileName}`,
            'x:upload_id': credentials.uploadId,
            'x-oss-signature': credentials.signature,
            'x-oss-signature-version': credentials.xOssSignatureVersion,
            'x-oss-credential': credentials.xOssCredentials,
            'x-oss-date': credentials.xOssDate,
            'x-oss-security-token': credentials.securityToken,
        };

        if (dimensions) {
            headers['x:width'] = Math.round(dimensions.width).toString();
            headers['x:height'] = Math.round(dimensions.height).toString();
        }

        const file = this.#getFile(fileParams);

        const reqInfo = {
            href: credentials.host,
            reqData: {
                uri: file.uri,
                credentials,
                options,
            },
            method: FetchEnums.Method.POST,
            headers: {},
        };

        try {
            const res = await fetch(credentials.host, {
                body: file,
                headers,
                method: FetchEnums.Method.POST,
            });

            if (
                (res.status as FetchEnums.StatusCode) ===
                FetchEnums.StatusCode.Success
            ) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const jsonBody: ApiTypes.ResponseRaw<T> = await res.json();
                    if (jsonBody.code === ApiEnums.SuccessCode.Success) {
                        return {
                            uploadId: credentials.uploadId,
                            data: jsonBody.data,
                        };
                    }

                    throw new UploadError(jsonBody, reqInfo);
                } catch (e) {
                    throw new RequestParseJSONError(await res.text(), {
                        request: reqInfo,
                        response: {
                            headers: res.headers,
                        },
                        message: ErrUtils.getErrorMsg(e),
                        sourceError: e,
                    });
                }
            }

            throw new RequestError({
                request: reqInfo,
                response: {
                    status: res.status,
                    details: res,
                    headers: res.headers,
                },
                message: null,
            });
        } catch (e) {
            throw new FetchError({
                request: reqInfo,
                sourceError: e,
                message: ErrUtils.getErrorMsg(e),
            });
        }
    };

    public readonly downloadToCache = async (uri: FileTypes.Uri) => {
        const file = this.#getFile([
            Paths.cache,
            FileUtils.createFilenameByUri(uri),
        ]);

        return File.downloadFileAsync(uri, file);
    };

    public readonly copy = (fileParams: FileParams) => {
        const file = this.#getFile(fileParams);
        const copyTo = this.#getFile([
            Paths.cache,
            FileUtils.createFilenameByUri(file.uri),
        ]);
        file.copy(copyTo);

        return copyTo;
    };

    public readonly getPersistRawResource = (
        id: string,
        options: LibTypes.FrozenDefine<{
            ext: string,
        }>,
    ): FileTypes.RawResource | null => {
        const { ext } = options;

        const file = this.#getFile([this.#ResourceDir, `${id}${ext}`]);

        let result;

        if (file.exists) {
            result = {
                localUri: file.uri,
            };
        }

        return result ?? null;
    };

    public readonly getRawResource = (
        id: string,
        options: LibTypes.FrozenDefine<{
            ext: string,
        }>,
    ): FileTypes.RawResource | null => {
        const { ext } = options;

        let result;

        let file = this.#getFile([this.#ResourceCacheDir, `${id}${ext}`]);

        if (file.exists) {
            result = {
                localUri: file.uri,
            };
        } else {
            file = this.#getFile([this.#ResourceDir, `${id}${ext}`]);

            if (file.exists) {
                result = {
                    localUri: file.uri,
                };
            }
        }

        return result ?? null;
    };

    public readonly getAndSaveRawResource = async (
        id: string,
        options: LibTypes.FrozenDefine<{
            ext: string,
            persist?: boolean,
            remoteUri?: string,
        }>,
    ): Promise<FileTypes.RawResource | null> => {
        const { remoteUri, ext, persist } = options;

        let result = this.getRawResource(id, { ext });

        let needSave = false;

        if (persist) {
            const persistResult = this.getPersistRawResource(id, { ext });
            if (!persistResult) {
                needSave = true;
            }
        } else if (!result) {
            needSave = true;
        }

        if (needSave && !StringUtils.isEmpty(remoteUri)) {
            const dir = persist ? this.#ResourceDir : this.#ResourceCacheDir;

            const file = this.#getFile([dir, `${id}${ext}`]);
            if (!file.exists) {
                const dwonloadFile = await downloadManager.download(
                    id,
                    file,
                    remoteUri,
                );
                if (dwonloadFile.exists) {
                    result = {
                        localUri: dwonloadFile.uri,
                    };
                }
            } else {
                result = {
                    localUri: file.uri,
                };
            }
        }

        return result;
    };

    public readonly createAudioResource = (
        id: string,
        audio: FileTypes.AudioInfo,
        options: LibTypes.FrozenDefine<{
            persist?: boolean,
            cache?: boolean,
        }> = {},
    ): FileTypes.AudioResource => {
        const { cache = true } = options;

        const $this = this;
        const rawAudio = {
            ...audio,
        };

        const ext = FileUtils.getExtension(rawAudio.uri);

        if (cache) {
            this.getAndSaveRawResource(id, {
                ...options,
                remoteUri: rawAudio.uri,
                ext,
            });
        }
        return {
            id,
            ...rawAudio,
            get uri() {
                return this.local?.uri ?? rawAudio.uri;
            },
            remote: {
                uri: rawAudio.uri,
            },
            local: {
                get uri() {
                    if (cache) {
                        const result = $this.getRawResource(id, {
                            ...options,
                            ext,
                        });
                        if (!result) {
                            $this.getAndSaveRawResource(id, {
                                ...options,
                                ext,
                                remoteUri: rawAudio.uri,
                            });
                        }

                        return result?.localUri ?? null;
                    }

                    return null;
                },
            },
        };
    };

    public readonly createImageResource = (
        id: string,
        image: FileTypes.ImageInfo,
        options: LibTypes.FrozenDefine<{
            persist?: boolean,
            cache?: boolean,
        }> = {},
    ): FileTypes.ImageResource => {
        if (StringUtils.isEmpty(id)) {
            return this.createLocalImageResource(image);
        }

        const { cache = true } = options;

        const $this = this;
        const rawImage = {
            ...image,
        };

        const ext = FileUtils.getExtension(rawImage.uri);

        if (cache) {
            this.getAndSaveRawResource(id, {
                ...options,
                remoteUri: rawImage.uri,
                ext,
            });
        }
        return {
            id,
            ...rawImage,
            get uri() {
                return this.local?.uri ?? rawImage.uri;
            },
            remote: {
                uri: rawImage.uri,
            },
            local: {
                get uri() {
                    if (cache) {
                        const result = $this.getRawResource(id, {
                            ...options,
                            ext,
                        });
                        if (!result) {
                            $this.getAndSaveRawResource(id, {
                                ...options,
                                remoteUri: rawImage.uri,
                                ext,
                            });
                        }

                        return result?.localUri ?? null;
                    }

                    return null;
                },
            },
        };
    };

    public readonly createLocalImageResource = (
        image: FileTypes.ImageInfo,
    ): FileTypes.ImageResource => ({
        id: `${Settings.resourceIdPrefix}-${this.#resourceId--}`,
        ...image,
    });
}
