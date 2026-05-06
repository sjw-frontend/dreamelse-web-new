import type { Fest } from './@com';

export type LooseSetOptional<T, P extends PropertyKey> = Fest.SetOptional<
    T,
    P extends keyof T ? P : never
>;
