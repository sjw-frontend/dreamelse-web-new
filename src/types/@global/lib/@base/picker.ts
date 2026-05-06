import type { Fest } from '../@com';

import type { AbstractClass } from './class';
import type { DefinePick, VarOmit, VarPick } from './define';
import type { Func } from './function';
import type { FrozenGeneralObj, Reference } from './general';

type LooseReadonlyKeysOf<T> = T extends Reference
    ? Fest.ReadonlyKeysOf<T>
    : never;

export type ClassStaticFields<T extends AbstractClass> = VarOmit<
    VarPick<T, keyof T>,
    'prototype'
>;

export type ExcludeConditionalKeys<TSource, TCondition> = Exclude<
    keyof TSource,
    Fest.ConditionalKeys<TSource, TCondition>
>;

export type PickWritable<T> = VarOmit<T, LooseReadonlyKeysOf<T>>;
type _PickWritableDeep<
    TSource,
    TOmit = VarOmit<TSource, LooseReadonlyKeysOf<TSource>>,
> = TSource extends FrozenGeneralObj
    ? {
          [p in keyof TOmit]: _PickWritableDeep<TOmit[p]>;
      }
    : TSource;
export type PickWritableDeep<T> = _PickWritableDeep<T>;

export type PickAllowUndefined<T> = DefinePick<
    T,
    AllowUndefinedKeysOf<T>
>;
export type AllowUndefinedKeysOf<T> = {
    [p in keyof T]-?: undefined extends T[p] ? p : never;
}[keyof T];

export type PickNonNever<T> = DefinePick<T, NonNeverKeysOf<T>>;
export type NonNeverKeysOf<T> = ExcludeConditionalKeys<T, never>;

export type PickObject<T> = DefinePick<T, ObjectKeysOf<T>>;
export type ObjectKeysOf<T> = Fest.ConditionalKeys<T, FrozenGeneralObj>;

export type PickNonObject<T> = DefinePick<T, NonObjectKeysOf<T>>;
export type NonObjectKeysOf<T> = ExcludeConditionalKeys<T, FrozenGeneralObj>;

export type PickFunction<T> = DefinePick<T, FunctionKeysOf<T>>;
export type FunctionKeysOf<T> = Fest.ConditionalKeys<T, Func>;

export type PickNonFunction<T> = DefinePick<T, NonFunctionKeysOf<T>>;
export type NonFunctionKeysOf<T> = ExcludeConditionalKeys<T, Func>;
