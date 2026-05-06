// @ts-nocheck
import { Buffer } from 'buffer';

import { APP } from '$/consts';
import { ApiEnums } from '$/enums';
import type { ApiTypes } from '$/types';

import { getExtension } from './file';
import { uuid } from './key';

export type TosStsCredential = ApiTypes.Protocol.GetTosUploadCredentialResp;

export type GetTosCredentialOptions = LibTypes.FrozenDefine<{
    origin?: string,
    token: string,
    expiresIn?: number,
    authorizationScheme?: 'bearer' | 'raw',
}>;

const isRecord = (value: unknown): value is LibTypes.FrozenGeneralObj =>
    typeof value === 'object' && value !== null;

const isTosStsCredential = (value: unknown): value is TosStsCredential => {
    if (!isRecord(value)) return false;
    return (
        typeof value['access_key_id'] === 'string' &&
        typeof value['secret_access_key'] === 'string' &&
        typeof value['session_token'] === 'string' &&
        typeof value['bucket'] === 'string' &&
        typeof value['region'] === 'string' &&
        typeof value['endpoint'] === 'string' &&
        typeof value['expires_in'] === 'number'
    );
};

const getExpoFetch = async () => {
    const mod = await import('expo/fetch');
    return mod.fetch;
};

const normalizeLocalhostOrigin = async (origin: string) => {
    const matched =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(origin);
    if (!matched) {
        return origin;
    }

    try {
        const mod = await import('react-native');
        const nativeModules: unknown = Reflect.get(mod, 'NativeModules');
        if (!isRecord(nativeModules)) {
            return origin;
        }

        const sourceCode: unknown = nativeModules['SourceCode'];
        if (!isRecord(sourceCode)) {
            return origin;
        }

        const scriptURL: unknown = Reflect.get(sourceCode, 'scriptURL');
        if (typeof scriptURL !== 'string') {
            return origin;
        }

        const devUrl = new URL(scriptURL);
        const originUrl = new URL(origin);
        originUrl.hostname = devUrl.hostname;
        return originUrl.toString().replace(/\/$/, '');
    } catch {
        return origin;
    }
};

export const getTosCredential = async (
    options: GetTosCredentialOptions,
): Promise<TosStsCredential> => {
    const {
        origin = APP.ENV.ApiOrigin,
        token,
        expiresIn = 0,
        authorizationScheme = 'raw',
    } = options;

    const authorization =
        authorizationScheme === 'bearer' ? `Bearer ${token}` : token;

    const fetch = await getExpoFetch();
    const normalizedOrigin = await normalizeLocalhostOrigin(origin);
    // 没有 this，也没有注入容器上下文，只能用 fetch 去请求
    const res = await fetch(`${normalizedOrigin}/file/tos_credential`, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            expires_in: expiresIn,
        }),
    });

    if (!res.ok) {
        throw new Error(
            `getTosCredential failed: ${res.status} ${await res.text()}`,
        );
    }

    const jsonUnknown: unknown = await res.json();
    if (!isRecord(jsonUnknown)) {
        throw new Error('getTosCredential failed: invalid response');
    }

    const code = jsonUnknown['code'];
    if (typeof code !== 'number') {
        throw new Error('getTosCredential failed: invalid response code');
    }
    const apiCode = code as ApiTypes.Code;

    if (apiCode !== ApiEnums.SuccessCode.Success) {
        const msg =
            typeof jsonUnknown['msg'] === 'string' ? jsonUnknown['msg'] : '';
        throw new Error(
            `getTosCredential failed: ${apiCode} ${msg}`,
        );
    }

    const data = jsonUnknown['data'];
    if (!isTosStsCredential(data)) {
        throw new Error('getTosCredential failed: invalid response data');
    }

    return data;
};

export const normalizeTosEndpoint = (endpoint: string) => {
    if (/^https?:\/\//i.test(endpoint)) {
        const url = new URL(endpoint);
        return {
            endpoint: url.host,
            secure: url.protocol === 'https:',
        };
    }

    return {
        endpoint,
        secure: true,
    };
};

export const encodeTosKey = (key: string) =>
    key
        .split('/')
        .filter(Boolean)
        .map(part => encodeURIComponent(part))
        .join('/');

export type BuildTosObjectUrlOptions = LibTypes.FrozenDefine<{
    bucket: string,
    endpoint: string,
    key: string,
    secure?: boolean,
}>;

export const buildTosObjectUrl = (options: BuildTosObjectUrlOptions) => {
    const { bucket, endpoint, key, secure = true } = options;
    const protocol = secure ? 'https' : 'http';
    return `${protocol}://${bucket}.${endpoint}/${encodeTosKey(key)}`;
};

export type UploadImageToTosOptions = LibTypes.FrozenDefine<{
    imageUri: string,
    token: string,
    origin?: string,
    expiresIn?: number,
    authorizationScheme?: 'bearer' | 'raw',
    uploadPath?: string,
    fileName?: string,
    key?: string,
    contentType?: string,
    onProgress?: (percent: number) => void,
}>;

export type UploadImageToTosResult = LibTypes.FrozenDefine<{
    bucket: string,
    key: string,
    url: string,
    signedUrl: string,
    etag: string | null,
}>;

const getTosClientCtor = async () => {
    const mod = await import('@volcengine/tos-sdk');
    return mod.TosClient;
};

const normalizeUploadPath = (uploadPath: string) =>
    uploadPath
        .split('/')
        .map(v => v.trim())
        .filter(Boolean)
        .join('/');

const getImageContentType = (ext: string) => {
    const lower = ext.toLowerCase();
    if (lower === '.jpg' || lower === '.jpeg') return 'image/jpeg';
    if (lower === '.png') return 'image/png';
    if (lower === '.webp') return 'image/webp';
    if (lower === '.heic' || lower === '.heif') return 'image/heic';
    return 'application/octet-stream';
};

export const uploadImageToTos = async (
    options: UploadImageToTosOptions,
): Promise<UploadImageToTosResult> => {
    const {
        imageUri,
        uploadPath = 'tmp',
        fileName,
        key,
        contentType,
        onProgress,
    } = options;

    const credential = await getTosCredential(options);
    const { endpoint, secure } = normalizeTosEndpoint(credential.endpoint);

    const TosClient = await getTosClientCtor();
    const client = new TosClient({
        accessKeyId: credential.access_key_id,
        accessKeySecret: credential.secret_access_key,
        stsToken: credential.session_token,
        bucket: credential.bucket,
        region: credential.region,
        endpoint,
        secure,
    });

    const ext = getExtension(imageUri);
    const finalExt = ext !== '' ? ext : '.jpg';
    const finalFileName = fileName ?? `${uuid()}${finalExt}`;
    const finalKey =
        key ??
        `${normalizeUploadPath(uploadPath)}/${finalFileName}`.replace(
            /^\/+/,
            '',
        );

    const { File } = await import('expo-file-system');
    const file = new File(imageUri);
    const fileType =
        typeof file.type === 'string' && file.type !== ''
            ? file.type
            : getImageContentType(finalExt);
    const finalContentType =
        typeof contentType === 'string' && contentType !== ''
            ? contentType
            : fileType;
    const bytes = await file.bytes();
    const body = Buffer.from(bytes);

    const res = await client.putObject({
        bucket: credential.bucket,
        key: finalKey,
        body,
        contentType: finalContentType,
        progress: onProgress,
    });

    const signedUrl = client.getPreSignedUrl({
        bucket: credential.bucket,
        key: finalKey,
        method: 'GET',
        expires: Math.max(60, credential.expires_in - 30),
    });

    return {
        bucket: credential.bucket,
        key: finalKey,
        url: buildTosObjectUrl({
            bucket: credential.bucket,
            endpoint,
            key: finalKey,
            secure,
        }),
        signedUrl,
        etag: res.headers['etag'] ?? null,
    };
};
