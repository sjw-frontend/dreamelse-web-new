import type { Exist, FrozenGeneralObj, Reference, UnExist } from './@base/general';
import type {
    OverrideConditional,
    OverrideIfAny,
    OverrideIfAnyOrNever,
    OverrideIfUnknown,
    OverrideNullable,
} from './@base/override';
import type { Fest } from './@com';

type _Merge<A, B, TOptions extends Fest.MergeDeepOptions> = A extends UnExist
    ? A
    : Fest.MergeDeep<A, B, TOptions>;

// TODO 待调试和完善
export type Merge<A, B, TOptions extends Fest.MergeDeepOptions = FrozenGeneralObj> =
    Fest.IsNever<A> extends true
        ? never
        : _Merge<
              OverrideConditional<
                  OverrideIfUnknown<OverrideIfAny<A, Exist>, Exist>,
                  Reference,
                  Exist
              >,
              OverrideIfAnyOrNever<OverrideNullable<B, Exist>>,
              TOptions
          >;
