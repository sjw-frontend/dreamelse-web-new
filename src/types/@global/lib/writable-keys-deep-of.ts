// @ts-nocheck
import type { GreaterThan, Sum } from 'type-fest';

import type { Arr } from './@base/array';
import type { FrozenGeneralObj, SimpleObjKey } from './@base/general';
import type { Fest } from './@com';
import type { Nullable } from './nullable';

type JoinKeys<
    TPreKeys extends Arr<SimpleObjKey>,
    TKey extends SimpleObjKey,
> = TKey extends never ? never : Fest.Join<[...TPreKeys, TKey], '.'>;

type _WritableKeysDeepOf<
    T extends FrozenGeneralObj,
    TPreKeys extends Arr<SimpleObjKey>,
    TDepth extends number,
> =
    | JoinKeys<TPreKeys, Fest.WritableKeysOf<T> & SimpleObjKey>
    | Required<{
          [k in keyof T]: k extends SimpleObjKey
              ? T[k] extends Nullable<FrozenGeneralObj>
                  ? GreaterThan<TDepth, 5> extends true
                      ? never
                      : _WritableKeysDeepOf<
                            T[k] & {},
                            [...TPreKeys, k],
                            Sum<TDepth, 1>
                        >
                  : never
              : never;
      }>[keyof T];

export type WritableKeysDeepOf<
    T extends FrozenGeneralObj,
    TPreKeys extends Arr<SimpleObjKey> = [],
> = _WritableKeysDeepOf<T, TPreKeys, 0> & SimpleObjKey;
