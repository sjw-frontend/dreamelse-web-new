import type { Arr } from './@base/array';
import type { Define } from './@base/define';
import type { Fest } from './@com';

type _KeyValueUnion<
    T,
    K extends Arr = Fest.UnionToTuple<keyof T>,
> = K extends readonly [...infer R, infer L]
    ? L extends keyof T
        ? | _KeyValueUnion<T, R>
              // eslint-disable-next-line custom/no-literal-object
              | Define<{
                    key: L,
                    value: T[L],
                }>
        : never
    : never;

export type KeyValueUnion<T> = _KeyValueUnion<T>;
