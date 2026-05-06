import type { Nullable } from './nullable';

export type NonEmptyString<T extends Nullable<string>> = Exclude<
    T,
    Nullable<''>
>;
