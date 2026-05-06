// @ts-nocheck
import type { Simplify } from 'type-fest';

declare const sym: unique symbol;
type Sym = typeof sym;

type ClearUndefined<T> = {
    [P in keyof T]: Exclude<T[P], Sym>;
};

type AddUndefined<T> = {
    [P in keyof T]: Sym extends T[P] ? T[P] | undefined : T[P];
};

type SetSym<T> = {
    [P in keyof T]-?: undefined extends T[P] ? Sym | T[P] : T[P];
};

export type RequiredKeepUndefined<T> = Simplify<
    ClearUndefined<AddUndefined<SetSym<T>>>
>;
