import type { Fest } from '../@com';

import type { IsInteger } from './is';

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type Arr<T = unknown> = ReadonlyArray<T>;

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type VarArr<T = unknown> = Array<T>;

export type Tuple<TLen extends number, TValue = unknown> =
    IsInteger<TLen> extends true ? Readonly<Fest.TupleOf<TLen, TValue>> : never;

export type VarTuple<TLen extends number, TValue = unknown> = [
    ...Tuple<TLen, TValue>,
];

export type MinLengthArray<TLen extends number, TValue = unknown> = Readonly<
    VarMinLengthArray<TLen, TValue>
>;

export type VarMinLengthArray<TLen extends number, TValue = unknown> = [
    ...Tuple<TLen, TValue>,
    ...Arr<TValue>,
];

export type Arrayable<T> = Arr<T> | T;

export type VarArrayable<T> = T | VarArr<T>;
