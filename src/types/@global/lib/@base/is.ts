import type { Fest, LooseFunc } from '../@com';

import type { Arr } from './array';
import type { VarPick } from './define';
import type {
    Exist,
    FrozenGeneralObj,
    Primitive,
    Reference,
    UnExist,
    UnboundedPrimitive,
} from './general';

export type IsExtends<A, B> = [A] extends [B] ? true : false;
export type Is2WayExtends<A, B> = [A] extends [B]
    ? [B] extends [A]
        ? true
        : false
    : false;

export type IsPrimitiveEqual<A extends Primitive, B extends Primitive> =
    Fest.IsAny<A> extends true
        ? Fest.IsAny<B> extends true
            ? true
            : false
        : Fest.IsAny<B> extends true
          ? false
          : Is2WayExtends<A, B>;

export type IsTrue<T extends boolean> = IsPrimitiveEqual<T, true>;

export type IsFalse<T extends boolean> = IsPrimitiveEqual<T, false>;

export type Not<T extends boolean> =
    IsTrue<T> extends true ? false : IsFalse<T> extends true ? true : boolean;

export type IsAnyOrNever<T> =
    Fest.IsAny<T> extends true
        ? true
        : Fest.IsNever<T> extends true
          ? true
          : false;

export type IsNull<T> = Fest.IsEqual<T, null>;

export type IsUndefined<T> = Fest.IsEqual<T, undefined>;

export type IsUnExist<T> =
    IsNull<T> extends true
        ? true
        : IsUndefined<T> extends true
          ? true
          : Fest.IsEqual<T, UnExist>;

export type IsNullable<T> =
    Fest.IsNever<T> extends true
        ? false
        : null extends T
          ? true
          : undefined extends T
            ? true
            : false;

export type IsInteger<T> =
    IsAnyOrNever<T> extends true ? false : Fest.IsInteger<T>;

export type IsPartialObject<T> =
    IsAnyOrNever<T> extends true
        ? false
        : T extends Arr
          ? false
          : T extends Reference
            ? Fest.IsEqual<T, Partial<T>>
            : false;

export type IsHasLiteral<T extends UnboundedPrimitive> =
    IsAnyOrNever<T> extends true
        ? false
        : IsTrue<Fest.IsLiteral<Extract<T, number>>> extends true
          ? true
          : IsTrue<Fest.IsLiteral<Extract<T, string>>> extends true
            ? true
            : IsTrue<Fest.IsLiteral<Extract<T, bigint>>> extends true
              ? true
              : IsTrue<Fest.IsLiteral<Extract<T, symbol>>>;

export type IsHasUnbounded<T extends UnboundedPrimitive> =
    IsAnyOrNever<T> extends true
        ? false
        : IsExtends<string, T> extends true
          ? true
          : IsExtends<number, T> extends true
            ? true
            : IsExtends<bigint, T> extends true
              ? true
              : IsExtends<symbol, T>;

export type IsLiteral<T extends UnboundedPrimitive> =
    IsAnyOrNever<T> extends true ? false : Not<IsHasUnbounded<T>>;

export type IsUnbounded<T extends UnboundedPrimitive> =
    IsAnyOrNever<T> extends true ? false : Not<IsHasLiteral<T>>;

export type IsEmptyObjectLike<T> =
    Fest.IsEqual<T, Fest.EmptyObject> extends true
        ? true
        : Fest.IsEqual<T, Exist> extends true
          ? true
          : Fest.IsEqual<T, Reference> extends true
            ? true
            : false;

export type IsSafe<T> =
    Fest.IsAny<T> extends true
        ? false
        : Fest.IsNever<T> extends true
          ? true
          : IsExtends<LooseFunc, T> extends false
            ? true
            : false;

export type IsSubObject<A extends FrozenGeneralObj, B extends FrozenGeneralObj> =
    IsAnyOrNever<A> extends true
        ? false
        : IsAnyOrNever<B> extends true
          ? false
          : keyof A extends keyof B
            ? A extends VarPick<B, keyof A>
                ? true
                : false
            : false;

type _IsExplicit<T, TElse> =
    IsSafe<T> extends false
        ? false
        : Fest.IsUnknown<T> extends true
          ? false
          : Fest.IsNever<T> extends true
            ? false
            : T extends Primitive
              ? true
              : IsEmptyObjectLike<T> extends true
                ? false
                : TElse;

export type IsExplicit<T> = _IsExplicit<T, IsLiteral<keyof T>>;
export type IsExplicitReference<T extends Reference> = IsExplicit<T>;
export type IsExplicitObject<T extends FrozenGeneralObj> = IsExplicit<T>;

export type IsLooseExplicit<T> = _IsExplicit<T, IsHasLiteral<keyof T>>;
export type IsLooseExplicitReference<T extends Reference> = IsLooseExplicit<T>;
export type IsLooseExplicitObject<T extends FrozenGeneralObj> = IsLooseExplicit<T>;
