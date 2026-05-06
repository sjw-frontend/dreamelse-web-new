import type { FrozenGeneralObj, Reference } from './@base/general';
import type {
    OverrideIfAny,
    OverrideIfAnyOrNever,
    OverrideIfEqual,
} from './@base/override';

export type InferGeneralObjDefaultTypeParam<T> = OverrideIfEqual<
    OverrideIfAnyOrNever<T, Reference>,
    FrozenGeneralObj,
    Reference
>;

export type InferGeneralObjDefaultTypeParamIgnoreNever<T> = OverrideIfEqual<
    OverrideIfAny<T, Reference>,
    FrozenGeneralObj,
    Reference
>;
