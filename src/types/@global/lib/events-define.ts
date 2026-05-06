import type { ListenerLikeCallbackSymbol } from '$/global-symbol';

import type { Arr } from './@base/array';
import type { Define } from './@base/define';
import type { Func } from './@base/function';
import type { Reference, VarGeneralObj } from './@base/general';
import type { PickFunction } from './@base/picker';
import type { Fest } from './@com';

export type BaseEventName = number | string;

export type BaseEventMap = VarGeneralObj<Func, BaseEventName>;

export type EmitEvent<
    TEventMap extends BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
> = <E extends TEventName>(
    eventName: E,
    ...args: Parameters<TEventMap[E]>
    // eslint-disable-next-line custom/no-literal-object
) => Define<{
    all: Promise<Arr<LibTypes.Nullable<Awaited<ReturnType<TEventMap[E]>>>>>,
    race: Promise<LibTypes.Nullable<Awaited<ReturnType<TEventMap[E]>>>>,
}>;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface IListenerLike {
    (): void,
    [ListenerLikeCallbackSymbol]?: LibTypes.Func,
}

export type ListenerLike = IListenerLike;

export type AddEventListener<
    TEventMap extends BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    // eslint-disable-next-line custom/no-literal-object
> = {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    func<E extends TEventName>(eventName: E, cb: TEventMap[E]): ListenerLike,
}['func'];

export type RemoveEventListener<
    TEventMap extends BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    // eslint-disable-next-line custom/no-literal-object
> = {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    func<E extends TEventName>(eventName: E, cb: TEventMap[E]): void,
}['func'];

// eslint-disable-next-line custom/no-literal-object
export type RemoveAllEventListeners<TEventName extends BaseEventName> = {
    // eslint-disable-next-line @typescript-eslint/method-signature-style, @typescript-eslint/no-unnecessary-type-parameters
    func<E extends TEventName>(eventName?: E): void,
}['func'];

type _EventsDefine<
    TEventMap extends BaseEventMap,
    TEventName extends BaseEventName & keyof TEventMap = BaseEventName &
        keyof TEventMap,
    // eslint-disable-next-line custom/no-literal-object
> = Define<{
    eventName: TEventName,
    callbacksMap: {
        [k in TEventName]?: Set<TEventMap[k]>;
    },
    emitEvent: EmitEvent<TEventMap, TEventName>,
    emitEventEnsureReceived: EmitEvent<TEventMap, TEventName>,
    addEventListener: AddEventListener<TEventMap, TEventName>,
    removeEventListener: RemoveEventListener<TEventMap, TEventName>,
    removeAllEventListeners: RemoveAllEventListeners<TEventName>,
}>;

export type EventsDefine<TEventMap extends BaseEventMap> =
    _EventsDefine<TEventMap>;

export type OriginalCallEventCallbackInfo<F extends LibTypes.Func> = Define<
    // eslint-disable-next-line custom/no-literal-object
    | {
          kind: 'postCall',
          value: Awaited<ReturnType<F>>,
      }
    // eslint-disable-next-line custom/no-literal-object
    | {
          kind: 'preCall',
          value: Readonly<Parameters<F>>,
      }
>;

type EventObj<TObj extends Reference> = LibTypes.FrozenGeneralObj & TObj;

type _OriginalCallEventMap<
    TObj extends Reference,
    TEventName extends string,
> = PickFunction<
    {
        [k in keyof TObj]: k extends string
            ? TObj[k] extends LibTypes.Func
                ? LibTypes.Func<
                      void,
                      [evt: OriginalCallEventCallbackInfo<TObj[k]>]
                  >
                : never
            : never;
    } & {
        [k in TEventName]: EventObj<TObj>[k] extends LibTypes.Func
            ? LibTypes.Func<
                  void,
                  [evt: OriginalCallEventCallbackInfo<EventObj<TObj>[k]>]
              >
            : never;
    }
>;

export type OriginalCallEventMap<
    TObj extends Reference,
    TEventName extends string = never,
> =
    Fest.IsNever<TEventName> extends true
        ? _OriginalCallEventMap<TObj, never>
        : Fest.IsUnknown<EventObj<TObj>[TEventName]> extends true
          ? never
          : _OriginalCallEventMap<TObj, TEventName>;

// eslint-disable-next-line custom/no-literal-object
type CallBeforeCallbackInfo<F extends LibTypes.Func> = Define<{
    params: Readonly<Parameters<F>>,
}>;

type _CallBeforeEventMap<
    TObj extends Reference,
    TEventName extends string,
> = PickFunction<
    {
        [k in keyof TObj]: k extends string
            ? TObj[k] extends LibTypes.Func
                ? LibTypes.Func<void, [evt: CallBeforeCallbackInfo<TObj[k]>]>
                : never
            : never;
    } & {
        [k in TEventName]: EventObj<TObj>[k] extends LibTypes.Func
            ? LibTypes.Func<
                  void,
                  [evt: CallBeforeCallbackInfo<EventObj<TObj>[k]>]
              >
            : never;
    }
>;

type CallBeforeEventMap<
    TObj extends Reference,
    TEventName extends string = never,
> =
    Fest.IsNever<TEventName> extends true
        ? _CallBeforeEventMap<TObj, never>
        : Fest.IsUnknown<EventObj<TObj>[TEventName]> extends true
          ? never
          : _CallBeforeEventMap<TObj, TEventName>;

// eslint-disable-next-line custom/no-literal-object
type CallAfterCallbackInfo<F extends LibTypes.Func> = Define<{
    result: Awaited<ReturnType<F>>,
}>;

type _CallAfterEventMap<
    TObj extends Reference,
    TEventName extends string,
> = PickFunction<
    {
        [k in keyof TObj]: k extends string
            ? TObj[k] extends LibTypes.Func
                ? LibTypes.Func<void, [evt: CallAfterCallbackInfo<TObj[k]>]>
                : never
            : never;
    } & {
        [k in TEventName]: EventObj<TObj>[k] extends LibTypes.Func
            ? LibTypes.Func<
                  void,
                  [evt: CallAfterCallbackInfo<EventObj<TObj>[k]>]
              >
            : never;
    }
>;

type CallAfterEventMap<
    TObj extends Reference,
    TEventName extends string = never,
> =
    Fest.IsNever<TEventName> extends true
        ? _CallAfterEventMap<TObj, never>
        : Fest.IsUnknown<EventObj<TObj>[TEventName]> extends true
          ? never
          : _CallAfterEventMap<TObj, TEventName>;

type _CallListener<
    TEventMap extends BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    // eslint-disable-next-line custom/no-literal-object
> = {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    func<E extends TEventName>(eventName: E, cb: TEventMap[E]): void,
}['func'];

export type CallListener<
    TObj extends Reference,
    TEventName extends string = never,
    // eslint-disable-next-line custom/no-literal-object
> = Define<{
    before: _CallListener<CallBeforeEventMap<TObj, TEventName>>,
    after: _CallListener<CallAfterEventMap<TObj, TEventName>>,
}>;
