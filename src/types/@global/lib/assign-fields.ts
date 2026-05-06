import type { Assign } from './assign';

export type AssignFields<
    TSource,
    TValue,
    K extends keyof TSource = keyof TSource,
> = Assign<
    TSource,
    {
        [p in K]: Assign<TSource[p], TValue>;
    }
>;
