import { FetchEnums } from '$/enums';
import type { ApiTypes, FetchTypes } from '$/types';

export abstract class BaseError extends Error {
    public constructor(msg?: string) {
        super(msg ?? 'unknown error');
    }

    public override readonly name: string = 'BaseError';
}

export class AppError extends BaseError {
    public override readonly name: string = 'AppError';
}

export class TimeoutError extends BaseError {
    public override readonly name: string = 'TimeoutError';
}

export class LoginError extends BaseError {
    public override readonly name: string = 'LoginError';
}

export class VoiceError extends BaseError {
    public override readonly name: string = 'VoiceError';
}

type FetchErrorOptions = LibTypes.FrozenDefine<{
    message: string | null | undefined,
    sourceError: unknown,
    request: {
        href: string,
        reqData: unknown,
        method: FetchTypes.Method | undefined,
        headers: FetchTypes.Headers | undefined,
    },
}>;

export class FetchError extends BaseError {
    public constructor(options: FetchErrorOptions) {
        super(options.message ?? undefined);
        this.request = options.request;
        this.sourceError = options.sourceError;
    }

    public override readonly name: string = 'FetchError';

    public readonly request;
    public readonly sourceError;
}

type RequestErrorOptions = LibTypes.FrozenDefine<
    LibTypes.FrozenOmit<FetchErrorOptions, 'sourceError'> & {
        response: {
            status: FetchTypes.StatusCode,
            details: unknown,
            headers?: FetchTypes.Headers | Headers,
        },
    }
>;

export class RequestError extends FetchError {
    public constructor(options: RequestErrorOptions) {
        super({
            sourceError: null,
            ...options,
        });
        this.statusCode = options.response.status;
        this.response = options.response;
    }

    public override readonly name: string = 'RequestError';

    public readonly statusCode;
    public readonly response;
}

type RequestJsonOptions = LibTypes.FrozenDefine<
    LibTypes.OmitDeep<
        RequestErrorOptions,
        'response.details' | 'response.status'
    > & {
        sourceError: unknown,
    }
>;

export class RequestParseJSONError extends RequestError {
    public constructor(textBody: string, options: RequestJsonOptions) {
        super({
            ...options,
            response: {
                ...options.response,
                details: textBody,
                status: FetchEnums.StatusCode.Success,
            },
        });
        this.textBody = textBody;
        this.sourceError = options.sourceError;
    }

    public override readonly name: string = 'RequestParseJSONError';

    public override readonly sourceError;
    public readonly textBody;
}

export class ApiError extends RequestError {
    public constructor(
        jsonBody: ApiTypes.ResponseRaw,
        request: RequestJsonOptions['request'],
    ) {
        super({
            request,
            response: {
                details: jsonBody,
                status: FetchEnums.StatusCode.Success,
            },
            message: jsonBody.msg,
        });
        this.jsonBody = jsonBody;
    }

    public override readonly name: string = 'ApiError';

    public readonly jsonBody;

    public customMsg?: string;
}

export class UploadError extends ApiError {
    public override readonly name: string = 'UploadError';
}

export * from './error-messages';
