import type { UnExist } from './@base/general';
import type { IsAnyOrNever } from './@base/is';

export type Nullable<T> = T | UnExist;

export type NullableIfAllowLoose<T> = T extends UnExist ? UnExist : T;

export type NullableIfAllow<T, V extends UnExist = never> = T extends UnExist
    ? IsAnyOrNever<V> extends true
        ? T
        : V
    : T;
