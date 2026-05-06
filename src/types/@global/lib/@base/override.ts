import type { Fest } from '../@com';

import type { FrozenGeneralObj } from './general';
import type { IsAnyOrNever, IsExplicit, IsSafe, IsSubObject } from './is';

export type OverrideConditional<TSource, TCondition, TOverride> =
    TSource extends TCondition
        ? TCondition extends TSource
            ? TOverride
            : TSource
        : TSource;

export type OverrideIfAny<TSource, TOverride = unknown> = Fest.If<
    Fest.IsAny<TSource>,
    TOverride,
    TSource
>;

export type OverrideIfAnyOrNever<TSource, TOverride = never> =
    IsAnyOrNever<TSource> extends true ? TOverride : TSource;

export type OverrideIfUnknown<TSource, TOverride = never> = Fest.If<
    Fest.IsUnknown<TSource>,
    TOverride,
    TSource
>;

export type OverrideIfUnsafe<TSource, TOverride = unknown> =
    IsSafe<TSource> extends true ? TSource : TOverride;

export type OverrideIfUnexplicit<TSource, TOverride = unknown> =
    IsExplicit<TSource> extends true ? TSource : TOverride;

export type OverrideIfUnequal<TSource, TTarget, TOverride = unknown> =
    Fest.IsEqual<TSource, TTarget> extends true ? TSource : TOverride;

export type OverrideIfEqual<TSource, TTarget, TOverride = unknown> =
    Fest.IsEqual<TSource, TTarget> extends true ? TOverride : TSource;

export type OverrideNullableValue<TSource, TOverride> = TSource extends
    | null
    | undefined
    ? TSource
    : TOverride;

export type OverrideNullable<TSource, TOverride> = TSource extends
    | null
    | undefined
    ? TOverride
    : TSource;

export type OverrideIfNonSubObject<
    TSource extends FrozenGeneralObj,
    TTarget extends FrozenGeneralObj,
    TOverride = unknown,
> = IsSubObject<TSource, TTarget> extends true ? TSource : TOverride;
