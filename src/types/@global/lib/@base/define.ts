import type { Fest } from '../@com';

import type { Arr } from './array';
import type { Reference } from './general';

export type FrozenDefine<
    TSource,
    TShallowReadonlyKeys extends keyof TSource = never,
> = Fest.Simplify<
    TSource extends Arr
        ? Fest.ReadonlyDeep<TSource>
        : TSource extends Reference
          ? Fest.ReadonlyDeep<Omit<TSource, TShallowReadonlyKeys>> & // eslint-disable-line @typescript-eslint/no-restricted-types
                // eslint-disable-next-line @typescript-eslint/no-restricted-types
                Readonly<Pick<TSource, TShallowReadonlyKeys>>
          : TSource
>;

export type Define<
    TSource,
    TVarKeys extends keyof TSource = never,
> = Fest.Simplify<
    TSource extends Arr
        ? Readonly<TSource>
        : TSource extends Reference
          ? Pick<TSource, TVarKeys> & Readonly<Omit<TSource, TVarKeys>> // eslint-disable-line @typescript-eslint/no-restricted-types
          : TSource
>;

export type VarDefine<TSource> = Fest.Simplify<TSource>;

export type FrozenPick<
    TSource,
    TKeys extends keyof TSource,
    TShallowReadonlyKeys extends TKeys = never,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = FrozenDefine<Pick<TSource, TKeys>, TShallowReadonlyKeys>;

export type FrozenPickDeep<
    TSource,
    TPaths extends Fest.Paths<TSource>,
> = FrozenDefine<Fest.PickDeep<TSource, TPaths>>;

export type DefinePick<
    TSource,
    TKeys extends keyof TSource,
    TVarKeys extends TKeys = never,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = Define<Pick<TSource, TKeys>, TVarKeys>;

export type DefinePickDeep<
    TSource,
    TPaths extends Fest.Paths<TSource>,
> = Define<Fest.PickDeep<TSource, TPaths>>;

export type VarPick<TSource, TKeys extends keyof TSource> = VarDefine<
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    Pick<TSource, TKeys>
>;

export type VarPickDeep<
    TSource,
    TPaths extends Fest.Paths<TSource>,
> = VarDefine<Fest.PickDeep<TSource, TPaths>>;

export type FrozenOmit<
    TSource,
    TKeys extends keyof TSource,
    TShallowReadonlyKeys extends Exclude<keyof TSource, TKeys> = never,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = FrozenDefine<Omit<TSource, TKeys>, TShallowReadonlyKeys>;

export type DefineOmit<
    TSource,
    TKeys extends keyof TSource,
    TVarKeys extends Exclude<keyof TSource, TKeys> = never,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = Define<Omit<TSource, TKeys>, TVarKeys>;

export type VarOmit<
    TSource,
    TKeys extends keyof TSource,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = VarDefine<Omit<TSource, TKeys>>;

export type FrozenOmitLoose<
    TSource,
    TKeys extends PropertyKey,
    TShallowReadonlyKeys extends Exclude<keyof TSource, TKeys> = never,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = FrozenDefine<Omit<TSource, TKeys>, TShallowReadonlyKeys>;

export type DefineOmitLoose<
    TSource,
    TKeys extends PropertyKey,
    TVarKeys extends Exclude<keyof TSource, TKeys> = never,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = Define<Omit<TSource, TKeys>, TVarKeys>;

export type VarOmitLoose<
    TSource,
    TKeys extends PropertyKey,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = VarDefine<Omit<TSource, TKeys>>;
