// web版：替换 expo/fetch / expo-file-system / react-native → native Web APIs
import { APP } from '$/consts';
import { ApiEnums } from '$/enums';
import type { ApiTypes } from '$/types';
import { getExtension } from './file';
import { uuid } from './key';

export type TosStsCredential = ApiTypes.Protocol.GetTosUploadCredentialResp;

export type GetTosCredentialOptions = LibTypes.FrozenDefine<{
    origin?: string;
    token: string;
    expiresIn?: number;
    authorizationScheme?: 'bearer' | 'raw';
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

export const getTosCredential = async (options: GetTosCredentialOptions): Promise<TosStsCredential> => {
    const { origin = APP.ENV.ApiOrigin, token, expiresIn = 0, authorizationScheme = 'raw' } = options;
    const authorization = authorizationScheme === 'bearer' ? `Bearer ${token}` : token;
    const res = await fetch(`${origin}/file/tos_credential`, {
        method: 'POST',
        headers: { accept: 'application/json', Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in: expiresIn }),
    });
    if (!res.ok) throw new Error(`getTosCredential failed: ${res.status} ${await res.text()}`);
    const jsonUnknown: unknown = await res.json();
    if (!isRecord(jsonUnknown)) throw new Error('getTosCredential failed: invalid response');
    const code = jsonUnknown['code'];
    if (typeof code !== 'number') throw new Error('getTosCredential failed: invalid response code');
    const apiCode = code as ApiTypes.Code;
    if (apiCode !== ApiEnums.SuccessCode.Success) {
        const msg = typeof jsonUnknown['msg'] === 'string' ? jsonUnknown['msg'] : '';
        throw new Error(`getTosCredential failed: ${apiCode} ${msg}`);
    }
    const data = jsonUnknown['data'];
    if (!isTosStsCredential(data)) throw new Error('getTosCredential failed: invalid response data');
    return data;
};

export const normalizeTosEndpoint = (endpoint: string) => {
    if (/^https?:\/\//i.test(endpoint)) {
        const url = new URL(endpoint);
        return { endpoint: url.host, secure: url.protocol === 'https:' };
    }
    return { endpoint, secure: true };
};

export const encodeTosKey = (key: string) =>
    key.split('/').filter(Boolean).map(part => encodeURIComponent(part)).join('/');

export type BuildTosObjectUrlOptions = LibTypes.FrozenDefine<{
    bucket: string;
    endpoint: string;
    key: string;
    secure?: boolean;
}>;

export const buildTosObjectUrl = (options: BuildTosObjectUrlOptions) => {
    const { bucket, endpoint, key, secure = true } = options;
    return `${secure ? 'https' : 'http'}://${bucket}.${endpoint}/${encodeTosKey(key)}`;
};

export type UploadImageToTosOptions = LibTypes.FrozenDefine<{
    imageUri: string;
    token: string;
    origin?: string;
    expiresIn?: number;
    authorizationScheme?: 'bearer' | 'raw';
    uploadPath?: string;
    fileName?: string;
    key?: string;
    contentType?: string;
    onProgress?: (percent: number) => void;
}>;

export type UploadImageToTosResult = LibTypes.FrozenDefine<{
    bucket: string;
    key: string;
    url: string;
    signedUrl: string;
    etag: string | null;
}>;

const getImageContentType = (ext: string) => {
    const lower = ext.toLowerCase();
    if (lower === '.jpg' || lower === '.jpeg') return 'image/jpeg';
    if (lower === '.png') return 'image/png';
    if (lower === '.webp') return 'image/webp';
    return 'application/octet-stream';
};

export const uploadImageToTos = async (options: UploadImageToTosOptions): Promise<UploadImageToTosResult> => {
    const { imageUri, uploadPath = 'tmp', fileName, key, contentType } = options;
    const credential = await getTosCredential(options);
    const { endpoint, secure } = normalizeTosEndpoint(credential.endpoint);
    const ext = getExtension(imageUri);
    const finalExt = ext !== '' ? ext : '.jpg';
    const finalFileName = fileName ?? `${uuid()}${finalExt}`;
    const finalKey = (key ?? `${uploadPath}/${finalFileName}`).replace(/^\/+/, '');
    const finalContentType = contentType ?? getImageContentType(finalExt);

    // Fetch the image as blob
    const imgRes = await fetch(imageUri);
    const blob = await imgRes.blob();

    const TosClient = (await import('@volcengine/tos-sdk')).TosClient;
    const client = new TosClient({
        accessKeyId: credential.access_key_id,
        accessKeySecret: credential.secret_access_key,
        stsToken: credential.session_token,
        bucket: credential.bucket,
        region: credential.region,
        endpoint,
        secure,
    });

    const res = await client.putObject({ bucket: credential.bucket, key: finalKey, body: blob, contentType: finalContentType });
    const signedUrl = client.getPreSignedUrl({ bucket: credential.bucket, key: finalKey, method: 'GET', expires: Math.max(60, credential.expires_in - 30) });

    return {
        bucket: credential.bucket,
        key: finalKey,
        url: buildTosObjectUrl({ bucket: credential.bucket, endpoint, key: finalKey, secure }),
        signedUrl,
        etag: res.headers['etag'] ?? null,
    };
};
