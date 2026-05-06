/* eslint-disable custom/no-literal-object */
import type { LooseFunc } from '../@com';

import type { Arr } from './array';
import type { Reference } from './general';

export type LooseClass = LooseFunc;

export type Class<
    TInst = Reference,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
> = {
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    readonly prototype: Pick<TInst, keyof TInst>,
    new (...args: Readonly<TArgs>): TInst,
};
export type Constructor<
    TInst = Reference,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
> = new (...args: Readonly<TArgs>) => TInst;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface _AbstractClass<
    TInst = Reference,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
> extends AbstractConstructor<TInst, TArgs> {
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    readonly prototype: Pick<TInst, keyof TInst>,
}
export type AbstractClass<
    TInst = Reference,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
> = _AbstractClass<TInst, TArgs>;
export type AbstractConstructor<
    TInst = Reference,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
> = abstract new (...args: Readonly<TArgs>) => TInst;
