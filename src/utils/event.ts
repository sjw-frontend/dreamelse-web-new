// @ts-nocheck
import { AppError } from '$/errors';
import { ListenerLikeCallbackSymbol } from '$/global-symbol';

import { getOwnPropertyNamesDeep, isKey } from './object';

export const createOriginalCallEvents = <
    TEventName extends string,
    TObj extends LibTypes.Reference,
>(
    obj: TObj,
) => {
    type EventMap = LibTypes.OriginalCallEventMap<TObj, TEventName>;

    const event = define<EventMap>();

    type EmitParameters = Parameters<typeof event.emitEvent>;

    const keys = getOwnPropertyNamesDeep(obj);
    keys.forEach(key => {
        if (
            !key.startsWith('__private_') &&
            key !== 'constructor' &&
            isKey(key, obj) &&
            typeof obj[key] === 'function'
        ) {
            const oldFunc = obj[key];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            obj[key] = function func(this: TObj, ...params: LibTypes.Arr) {
                const preInfo: LibTypes.OriginalCallEventCallbackInfo<LibTypes.Func> =
                    {
                        kind: 'preCall',
                        value: params,
                    };
                event.emitEvent(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    ...([key, preInfo] as unknown as EmitParameters),
                );

                const funcResult =
                    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */ (
                        oldFunc as LibTypes.Func<unknown, LibTypes.Arr, TObj>
                    ).call(this, ...params);

                if (funcResult instanceof Promise) {
                    return funcResult.then((result: unknown) => {
                        const postInfo: LibTypes.OriginalCallEventCallbackInfo<LibTypes.Func> =
                            {
                                kind: 'postCall',
                                value: result,
                            };
                        event.emitEvent(
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            ...([key, postInfo] as unknown as EmitParameters),
                        );

                        return result;
                    });
                }

                const postInfo: LibTypes.OriginalCallEventCallbackInfo<LibTypes.Func> =
                    {
                        kind: 'postCall',
                        value: funcResult,
                    };
                event.emitEvent(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    ...([key, postInfo] as unknown as EmitParameters),
                );

                return funcResult;
            } as TObj[string & keyof TObj];
        }
    });

    return {
        addEventListener: event.addEventListener,
        removeEventListener: event.removeEventListener,
        removeAllEventListeners: event.removeAllEventListeners,
    };
};

type HasCallbackItem = LibTypes.Define<{
    promise: Promise<void>,
    resolve: () => void,
}>;
const createNewHasCallbackItem = (): HasCallbackItem => {
    let resolve: HasCallbackItem['resolve'] | null = null;

    const promise = new Promise<void>(rl => {
        resolve = rl;
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (!resolve) {
        throw new AppError('createNewHasCallbackItem 未知异常');
    }

    return {
        promise,
        resolve,
    };
};

export const define = <TMap extends LibTypes.BaseEventMap>() => {
    type EventsDefine = LibTypes.EventsDefine<TMap>;

    const callbacksMap: EventsDefine['callbacksMap'] = {};

    const hasCallbackMap: LibTypes.VarGeneralObj<HasCallbackItem | undefined> =
        {};

    const emitEvent: EventsDefine['emitEvent'] = (eventName, ...params) => {
        const list: LibTypes.VarArr<Promise<ReturnType<TMap[keyof TMap]>>> = [];
        callbacksMap[eventName]?.forEach(cb => {
            list.push(
                Promise.resolve().then(
                    () =>
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        cb(...params) as ReturnType<TMap[keyof TMap]>,
                ),
            );
        });

        return {
            all: list.length > 0 ? Promise.all(list) : Promise.resolve([]),
            race: list.length > 0 ? Promise.race(list) : Promise.resolve(null),
        };
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const emitEventEnsureReceived = ((
        ...args: Parameters<EventsDefine['emitEventEnsureReceived']>
    ) => {
        const [eventName, ...params] = args;

        const p = (async () => {
            const hasCallbackItem =
                hasCallbackMap[eventName] ?? createNewHasCallbackItem();
            hasCallbackMap[eventName] = hasCallbackItem;

            const cbList = [...(callbacksMap[eventName] ?? [])];

            if (cbList.length > 0) {
                hasCallbackItem.resolve();
            }

            await hasCallbackItem.promise;

            const resultList: LibTypes.VarArr<
                Promise<ReturnType<TMap[keyof TMap]>>
            > = [];
            cbList.forEach(cb => {
                resultList.push(
                    Promise.resolve().then(
                        () =>
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            cb(...params) as ReturnType<TMap[keyof TMap]>,
                    ),
                );
            });

            return resultList;
        })();

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
        return {
            all: p.then(async list =>
                list.length > 0 ? Promise.all(list) : Promise.resolve([])),
            race: p.then(async list =>
                list.length > 0 ? Promise.race(list) : Promise.resolve(null)),
        } as ReturnType<EventsDefine['emitEventEnsureReceived']>;
    }) as EventsDefine['emitEventEnsureReceived'];

    const hasCallbackResolve = (eventName: keyof TMap, reset = false) => {
        let hasCallbackItem = hasCallbackMap[eventName];
        if (!reset) {
            hasCallbackItem ??= createNewHasCallbackItem();
        }
        hasCallbackItem?.resolve();

        hasCallbackMap[eventName] = reset ? undefined : hasCallbackItem;
    };

    const addEventListener: EventsDefine['addEventListener'] = (
        eventName,
        cb,
    ) => {
        callbacksMap[eventName] ??= new Set();
        callbacksMap[eventName].add(cb);
        const result: LibTypes.ListenerLike = () =>
            removeEventListener(eventName, cb);
        result[ListenerLikeCallbackSymbol] = cb;

        hasCallbackResolve(eventName);
        return result;
    };

    const removeEventListener: EventsDefine['removeEventListener'] = (
        eventName,
        cb,
    ) => {
        if (callbacksMap[eventName]?.has(cb)) {
            hasCallbackResolve(eventName, true);
            callbacksMap[eventName].delete(cb);
        }
    };

    const removeAllEventListeners: EventsDefine['removeAllEventListeners'] =
        eventName => {
            if (eventName != null) {
                callbacksMap[eventName] = new Set();
                hasCallbackResolve(eventName, true);
            } else {
                Object.keys(callbacksMap).forEach(evtName => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    (callbacksMap as LibTypes.VarGeneralObj<Set<unknown>>)[
                        evtName
                    ] = new Set();

                    hasCallbackResolve(evtName, true);
                });
            }
        };

    return {
        emitEvent,
        emitEventEnsureReceived,
        addEventListener,
        removeEventListener,
        removeAllEventListeners,
    } as const;
};
