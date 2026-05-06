import type { Arr } from './@base/array';
import type { IsPartialObject } from './@base/is';

export type OptionalArgumentsIfAllow<T extends Arr> = T extends readonly []
    ? T
    : number extends T['length']
      ? T
      : T extends readonly [...infer TRest, infer TLast]
        ? undefined extends TLast
            ? readonly [
                  ...OptionalArgumentsIfAllow<TRest>,
                  ...Partial<LastItemTuple<T>>,
              ]
            : IsPartialObject<TLast> extends true
              ? readonly [
                    ...OptionalArgumentsIfAllow<TRest>,
                    ...Partial<LastItemTuple<T>>,
                ]
              : T
        : T extends readonly [...infer TRest, unknown?]
          ? readonly [
                ...OptionalArgumentsIfAllow<TRest>,
                ...Partial<LastItemTuple<T>>,
            ]
          : T;

type RemoveLast<T extends Arr> = T extends [...infer R, unknown]
    ? R
    : T extends [...infer R, unknown?]
      ? R
      : never;
type LastItemTuple<T extends Arr, R extends Arr = RemoveLast<T>> = T extends [
    ...R,
    ...infer L,
]
    ? L
    : never;
