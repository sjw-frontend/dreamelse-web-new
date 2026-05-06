import type { MinLengthArray } from './@base/array';
import type { FrozenGeneralObj } from './@base/general';
import type { IsAnyOrNever } from './@base/is';
import type { Assign } from './assign';
import type { Nullable } from './nullable';

type AssignTupleArg = MinLengthArray<1, Nullable<FrozenGeneralObj>>;
type _AssignTuple<T extends AssignTupleArg> =
    IsAnyOrNever<T> extends true
        ? never
        : T extends readonly [infer TFirst, ...infer TRest]
          ? IsAnyOrNever<TFirst> extends true
              ? never
              : TRest extends readonly []
                ? TFirst
                : TRest extends AssignTupleArg
                  ? TFirst extends FrozenGeneralObj
                      ? Assign<TFirst, _AssignTuple<TRest>>
                      : _AssignTuple<TRest>
                  : never
          : never;
export type AssignTuple<T extends readonly [FrozenGeneralObj, ...AssignTupleArg]> =
    _AssignTuple<T>;
