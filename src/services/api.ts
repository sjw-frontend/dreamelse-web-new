import { APP } from '$/consts';
import { BaseService, service } from '$/core';
import { ApiEnums } from '$/enums';
import { ApiError } from '$/errors';
import type { ApiTypes, FetchTypes } from '$/types';
import { FetchUtils, KeyUtils, StringUtils } from '$/utils';

import { AppService } from './app/app-service';
import { FetchService } from './fetch/fetch-service';

const PathSymbol = Symbol('path');
const AuthorizationKey = 'Authorization';
const AppVersionKey = KeyUtils.create('appversion');
const AppUUIDKey = KeyUtils.create('UUID');

type CallProxyObj = LibTypes.VarGeneralObj<
    LibTypes.VarGeneralObj<ApiTypes.ProtocolCallMethod>
>;

@service()
export class ApiService extends BaseService {
    public constructor(appService: AppService, fetchService: FetchService) {
        super();
        this.#appService = appService;
        this.#fetchService = fetchService;
    }

    readonly #appService;
    readonly #fetchService;

    readonly #origin = APP.ENV.ApiOrigin;

    readonly #callProxyObj: CallProxyObj = {};
    readonly #callResponseRawProxyObj: CallProxyObj = {};

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    public readonly call = this.#createProxy(
        this.#callProxyObj,
        this.#call.bind(this),
    ) as ApiTypes.ProtocolCallMethods;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    public readonly callResponseRaw = this.#createProxy(
        this.#callResponseRawProxyObj,
        this.#callResponseRaw.bind(this),
    ) as ApiTypes.ResponseRawProtocolCallMethods;

    #createAuthValue(token: string) {
        return `Bearer ${token}`;
    }

    #createProxy(
        obj: CallProxyObj,
        call: (
            path: ApiTypes.UrlPath,
            reqData: ApiTypes.ReqData,
            options: ApiTypes.CallMethodOptions,
        ) => Promise<ApiTypes.ResData | ApiTypes.ResponseRaw>,
    ) {
        return new Proxy(obj, {
            get: (_, path1) => {
                let proxy = obj[path1];
                if (!proxy) {
                    const innerObj: LibTypes.ValueOf<CallProxyObj> = {};
                    proxy = new Proxy(innerObj, {
                        get: (__, path2) => {
                            if (!innerObj[path2]) {
                                const path = `/${path1.toString()}/${path2.toString()}`;
                                innerObj[path2] = async (
                                    reqData?: ApiTypes.ReqData,
                                    options: ApiTypes.CallMethodOptions = {},
                                ) => {
                                    // TODO
                                    const { retry = 0 } = options;
                                    let count = 0;
                                    const errors: LibTypes.VarArr = [];

                                    while (count <= retry) {
                                        try {
                                            count++;
                                            return await call(
                                                path,
                                                reqData ?? {},
                                                options,
                                            );
                                        } catch (e) {
                                            errors.push(e);
                                        }
                                    }

                                    // TODO 处理所有errors
                                    throw errors.at(-1);
                                };
                                Reflect.defineMetadata(
                                    PathSymbol,
                                    path,
                                    innerObj[path2],
                                );
                            }

                            return innerObj[path2];
                        },
                    });
                    obj[path1] = proxy;
                }

                return proxy;
            },
        });
    }

    async #callResponseRaw(
        path: ApiTypes.UrlPath,
        reqData: ApiTypes.ReqData,
        options: ApiTypes.CallMethodOptions,
    ) {
        options.headers ??= {};
        Object.assign(options.headers, await this.getAuthHeaders(), {
            [AppVersionKey]: this.#appService.AppInfo.appVersion,
            [AppUUIDKey]: (await this.#appService.getStoreData()).uuid,
        });
        if (!StringUtils.isEmpty(options.token)) {
            options.headers[AuthorizationKey] = this.#createAuthValue(
                options.token,
            );
        }

        const resRaw = await this.#fetchService.json<ApiTypes.ResponseRaw>(
            `${this.#origin}${path}`,
            {
                ...options,
                reqData,
            },
        );

        return resRaw;
    }

    async #call(
        path: ApiTypes.UrlPath,
        reqData: ApiTypes.ReqData,
        options: ApiTypes.CallMethodOptions,
    ) {
        options.headers ??= {};
        const resRaw = await this.#callResponseRaw(path, reqData, options);

        if (resRaw.code === ApiEnums.SuccessCode.Success) {
            return resRaw.data;
        }

        throw new ApiError(resRaw, {
            href: path,
            reqData,
            method: options.method,
            headers: options.headers,
        });
    }

    public readonly getURL = (
        method: ApiTypes.ProtocolCallMethod,
        search?: FetchTypes.LooseSearchParams | string,
    ) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const path = Reflect.getMetadata(PathSymbol, method) as
            | string
            | undefined;

        if (!StringUtils.isEmpty(path)) {
            return FetchUtils.createURL(`${this.#origin}${path}`, search);
        }

        return null;
    };

    public readonly getAuthHeaders = async () => {
        const token = (await this.#appService.getStoreData()).loggedIn?.token;

        if (token == null) {
            return null;
        }

        return {
            [AuthorizationKey]: this.#createAuthValue(token),
        };
    };
}
