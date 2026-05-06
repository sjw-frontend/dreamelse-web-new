// @ts-nocheck
// web版：替换 expo/fetch → native fetch

import { BaseService, service } from '$/core';
import { ApiEnums, FetchEnums } from '$/enums';
import {
    FetchError,
    RequestError,
    RequestParseJSONError,
    UploadError,
} from '$/errors';
import type { ApiTypes, FetchTypes, FileTypes, StyleTypes } from '$/types';
import { ErrUtils, StringUtils } from '$/utils';

import { Settings } from './file-const';
import { rewriteWebResourceUri } from './web-resource-uri';

@service()
export class FileService extends BaseService {
    #resourceId = -1;

    // eslint-disable-next-line @typescript-eslint/no-restricted-types, @typescript-eslint/no-unsafe-type-assertion
    public readonly createFile = (..._args: Array<unknown>) => null as unknown as import('expo-file-system').File;

    public readonly getInfo = (_fileParams: unknown) => null;

    public readonly delete = (_fileParams: unknown) => {};

    public readonly upload = async <T extends FetchTypes.ResData>(
        _fileParams: unknown,
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

        const reqInfo = {
            href: credentials.host,
            reqData: { fileName, credentials, options },
            method: FetchEnums.Method.POST,
            headers: {},
        };

        try {
            const res = await fetch(credentials.host, {
                headers,
                method: FetchEnums.Method.POST,
            });

            if ((res.status as FetchEnums.StatusCode) === FetchEnums.StatusCode.Success) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const jsonBody = (await res.json()) as unknown as ApiTypes.ResponseRaw<T>;
                    if (jsonBody.code === ApiEnums.SuccessCode.Success) {
                        return { uploadId: credentials.uploadId, data: jsonBody.data };
                    }
                    throw new UploadError(jsonBody, reqInfo);
                } catch (e) {
                    throw new RequestParseJSONError(await res.text(), {
                        request: reqInfo,
                        response: { headers: res.headers },
                        message: ErrUtils.getErrorMsg(e),
                        sourceError: e,
                    });
                }
            }

            throw new RequestError({
                request: reqInfo,
                response: { status: res.status, details: res, headers: res.headers },
                message: null,
            });
        } catch (e) {
            throw new FetchError({ request: reqInfo, sourceError: e, message: ErrUtils.getErrorMsg(e) });
        }
    };

    // eslint-disable-next-line @typescript-eslint/require-await
    public readonly downloadToCache = async (_uri: FileTypes.Uri) => null;

    public readonly copy = (_fileParams: unknown) => null;

    public readonly getPersistRawResource = (_id: string, _options: LibTypes.FrozenDefine<{ ext: string }>): FileTypes.RawResource | null => null;

    public readonly getRawResource = (_id: string, _options: LibTypes.FrozenDefine<{ ext: string }>): FileTypes.RawResource | null => null;

    // eslint-disable-next-line @typescript-eslint/require-await
    public readonly getAndSaveRawResource = async (
        _id: string,
        _options: LibTypes.FrozenDefine<{ ext: string, persist?: boolean, remoteUri?: string }>,
    ): Promise<FileTypes.RawResource | null> => null;

    public readonly createAudioResource = (
        id: string,
        audio: FileTypes.AudioInfo,
        _options: LibTypes.FrozenDefine<{ persist?: boolean, cache?: boolean }> = {},
    ): FileTypes.AudioResource => ({
        id,
        ...audio,
        get uri() { return rewriteWebResourceUri(audio.uri); },
        remote: { uri: audio.uri },
        local: { get uri() { return null; } },
    });

    public readonly createImageResource = (
        id: string,
        image: FileTypes.ImageInfo,
        _options: LibTypes.FrozenDefine<{ persist?: boolean, cache?: boolean }> = {},
    ): FileTypes.ImageResource => {
        if (StringUtils.isEmpty(id)) {
            return this.createLocalImageResource(image);
        }
        return {
            id,
            ...image,
            get uri() { return rewriteWebResourceUri(image.uri); },
            remote: { uri: image.uri },
            local: { get uri() { return null; } },
        };
    };

    public readonly createLocalImageResource = (image: FileTypes.ImageInfo): FileTypes.ImageResource => ({
        id: `${Settings.resourceIdPrefix}-${this.#resourceId--}`,
        ...image,
    });
}
