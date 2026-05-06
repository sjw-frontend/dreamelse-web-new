import type { Arr } from './array';
import type { Promisable } from './special';

export type Func<
    TReturn = unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
    TThis = void,
> = (this: TThis, ...args: Readonly<TArgs>) => TReturn;

export type LooseArgumentsFunc<
    TReturn = unknown,
    TArgs extends Arr = Arr,
    TThis = void,
    // eslint-disable-next-line custom/no-literal-object
> = {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    func(this: TThis, ...args: TArgs): TReturn,
}['func'];

export type SimpleFunction = () => void;

export type SimpleAsync = () => Promise<void>;

export type SimpleAsyncable = () => Promisable;

export type Async<
    TReturn = unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
    TThis = void,
> = Func<Promise<TReturn>, TArgs, TThis>;

export type Asyncable<
    TReturn = unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TArgs extends Arr = Arr<any>,
    TThis = void,
> = Func<Promisable<TReturn>, TArgs, TThis>;
