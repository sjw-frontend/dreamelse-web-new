import type { Arr } from './@base/array';
import type { IsAnyOrNever } from './@base/is';

export type PartialIgnoreArray<T> =
    IsAnyOrNever<T> extends true ? never : T extends Arr ? T : Partial<T>;
