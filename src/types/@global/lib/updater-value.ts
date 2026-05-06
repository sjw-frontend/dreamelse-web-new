import type { Func, LooseArgumentsFunc } from './@base/function';

export type UpdaterValue<T> = LooseArgumentsFunc<T, [preValue: T]> | T;

export type UpdaterNewValue<TPre, TNew> = Func<TNew, [preValue: TPre]> | TNew;
