import type { CoreTypes } from '$/types';

import { BaseModel } from './base-model';

const BaseDomainSymbol = Symbol('BaseDomain');

export abstract class BaseDomain<
    TState extends CoreTypes.ModelState,
    TInternalState extends TState,
    TEventMap extends LibTypes.BaseEventMap = never,
    TProps extends CoreTypes.Props = never,
> extends BaseModel<TState, TInternalState, TEventMap, TProps, never> {
    public static readonly [BaseDomainSymbol]: typeof BaseDomainSymbol =
        BaseDomainSymbol;

    public readonly [BaseDomainSymbol]: typeof BaseDomainSymbol =
        BaseDomainSymbol;

    public readonly dispose = () => {
        this.destroy();
    };
}
