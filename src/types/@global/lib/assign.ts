import type { Reference, UnExist } from './@base/general';
import type {
    OverrideIfAny,
    OverrideIfAnyOrNever,
    OverrideNullable,
} from './@base/override';
import type { Fest } from './@com';

// eslint-disable-next-line @typescript-eslint/no-restricted-types
type _Assign<A, B> = A extends UnExist ? A : B & Omit<A, keyof B>;

export type Assign<A, B> =
    Fest.IsNever<A> extends true
        ? never
        : Fest.Simplify<
              _Assign<
                  OverrideIfAny<A>,
                  OverrideIfAnyOrNever<OverrideNullable<B, Reference>>
              >
          >;
