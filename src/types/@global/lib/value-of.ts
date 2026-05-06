import type { Arr } from './@base/array';
import type { Reference, UnExist } from './@base/general';
import type { IsAnyOrNever } from './@base/is';
import type { Nullable } from './nullable';

export type ValueOf<T extends Nullable<Reference>> =
    IsAnyOrNever<T> extends true
        ? never
        : T extends UnExist
          ? never
          : T extends Arr
            ? T[number]
            : T[keyof T];
