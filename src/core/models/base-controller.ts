import type { CoreTypes } from '$/types';

import { BaseModel } from './base-model';

const BaseControllerSymbol = Symbol('BaseController');

export abstract class BaseController<
    TState extends CoreTypes.ModelState,
    TInternalState extends TState,
    TEventMap extends LibTypes.BaseEventMap,
    TProps extends CoreTypes.Props,
    TPresetsState extends LibTypes.FrozenGeneralObj,
> extends BaseModel<TState, TInternalState, TEventMap, TProps, TPresetsState> {
    public static readonly [BaseControllerSymbol]: typeof BaseControllerSymbol =
        BaseControllerSymbol;

    public readonly [BaseControllerSymbol]: typeof BaseControllerSymbol =
        BaseControllerSymbol;

    protected getDomain<T extends CoreTypes.DomainClass>(
        Domain: T,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) {
        return this[BaseModel.ZoneGetterSymbol].getDomain(Domain, ...args);
    }
}
