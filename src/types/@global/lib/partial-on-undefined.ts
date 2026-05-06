import type { AllowUndefinedKeysOf } from './@base/picker';
import type { Fest } from './@com';

export type PartialOnUndefined<T> = Fest.SetOptional<
    T,
    AllowUndefinedKeysOf<T>
>;
