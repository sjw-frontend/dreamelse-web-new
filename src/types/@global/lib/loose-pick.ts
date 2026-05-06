import type { DefinePick, FrozenPick, VarPick } from './@base/define';

export type LooseDefinePick<T, P extends PropertyKey> = FrozenPick<
    T,
    P extends keyof T ? P : never
>;

export type LooseShallowDefinePick<T, P extends PropertyKey> = DefinePick<
    T,
    P extends keyof T ? P : never
>;

export type LooseVarDefinePick<T, P extends PropertyKey> = VarPick<
    T,
    P extends keyof T ? P : never
>;
