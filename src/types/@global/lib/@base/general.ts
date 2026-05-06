import type { Fest } from '../@com';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Exist = {};

export type UnExist = null | undefined;

export type Primitive = Fest.Primitive;
export type NonNullablePrimitive = NonNullable<Primitive>;
export type UnboundedPrimitive = bigint | number | string | symbol;

export type SimpleObjKey = number | string;

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type Reference = object;

export type FrozenGeneralObj<
    TValue = unknown,
    TKeys extends PropertyKey = PropertyKey,
> = Fest.ReadonlyDeep<VarGeneralObj<TValue, TKeys>>;

export type GeneralObj<
    TValue = unknown,
    TKeys extends PropertyKey = PropertyKey,
> = Readonly<VarGeneralObj<TValue, TKeys>>;

export type VarGeneralObj<
    TValue = unknown,
    TKeys extends PropertyKey = PropertyKey,
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
> = Record<TKeys, TValue>;
