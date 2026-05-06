import { BaseService, service } from '$/core';
import { FetchEnums } from '$/enums';
import { FetchError, RequestError, RequestParseJSONError } from '$/errors';
import type { FetchTypes } from '$/types';
import { ErrUtils, JSONUtils, StringUtils, TaskUtils } from '$/utils';

import { Settings } from './fetch-const';

@service()
export class FetchService extends BaseService {
    #suspendPromise?: Promise<void>;

    async #getRequestErrorTextBody(res: Response) {
        let text = '';
        try {
            text = await res.text();
        } catch {}

        return text;
    }

    async #request(href: FetchTypes.Href, options: FetchTypes.RequestOptions) {
        try {
            await this.#suspendPromise;

            const {
                method = FetchEnums.Method.POST,
                body,
                reqData,
                headers = {},
                timeoutMS,
                isLongTask,
            } = options;

            const fetchURL = new URL(href);

            let fetchHeaders: FetchTypes.Headers = {};
            let fetchBody = body;

            if (method === FetchEnums.Method.POST) {
                fetchHeaders = {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                };

                if (reqData) {
                    fetchBody ??= JSONUtils.stringify(reqData);
                }
            } else if (method === FetchEnums.Method.GET) {
                reqData &&
                    Object.keys(reqData).forEach(key => {
                        const value = reqData[key];
                        if (value != null) {
                            fetchURL.searchParams.set(
                                key,
                                typeof value === 'object'
                                    ? JSONUtils.stringify(value)
                                    : String(value),
                            );
                        }
                    });
            }

            Object.assign(headers, fetchHeaders);

            const headersInst = new Headers();
            Object.keys(headers).forEach(k => {
                if (!StringUtils.isEmpty(headers[k])) {
                    headersInst.append(k, headers[k]);
                }
            });

            const res = await TaskUtils.runWithTimeout(
                fetch(fetchURL.href, {
                    method,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    body: fetchBody as BodyInit,
                    headers: headersInst,
                }),
                timeoutMS ??
                    (isLongTask ? Settings.longTimeoutMS : Settings.timeoutMS),
            );

            return res;
        } catch (e) {
            throw new FetchError({
                request: {
                    href,
                    reqData: options.reqData,
                    method: options.method,
                    headers: options.headers,
                },
                sourceError: e,
                message: ErrUtils.getErrorMsg(e),
            });
        }
    }

    public readonly json = async <TRes extends FetchTypes.ResData>(
        href: FetchTypes.Href,
        options: FetchTypes.RequestOptions = {},
    ) => {
        const res = await this.#request(href, options);

        const reqInfo = {
            href,
            reqData: options.reqData,
            method: options.method,
            headers: options.headers,
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (res.status === FetchEnums.StatusCode.Success) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                return (await res.json()) as TRes;
            } catch (e) {
                throw new RequestParseJSONError(
                    await this.#getRequestErrorTextBody(res),
                    {
                        request: reqInfo,
                        response: {
                            headers: res.headers,
                        },
                        message: ErrUtils.getErrorMsg(e),
                        sourceError: e,
                    },
                );
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
    };

    public readonly suspend = () => {
        let resolve: LibTypes.SimpleFunction | null = null;
        this.#suspendPromise = new Promise(r => {
            resolve = r;
        });

        return () => resolve?.();
    };
}
