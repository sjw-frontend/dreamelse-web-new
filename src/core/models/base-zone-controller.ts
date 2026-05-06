import type { CoreTypes } from '$/types';

import { BaseController } from './base-controller';

const OnActiveSymbol = Symbol('onActive');
const OnDeactiveSymbol = Symbol('onDeactive');

export abstract class BaseZoneController<
    TState extends CoreTypes.ModelState,
    TInternalState extends TState,
    TEventMap extends LibTypes.BaseEventMap = never,
> extends BaseController<TState, TInternalState, TEventMap, never, never> {
    public static readonly OnActiveSymbol: typeof OnActiveSymbol =
        OnActiveSymbol;

    public static readonly OnDeactiveSymbol: typeof OnDeactiveSymbol =
        OnDeactiveSymbol;

    protected onActive() {}
    protected onDeactive() {}

    public [OnActiveSymbol]() {
        this.onActive();
    }

    public [OnDeactiveSymbol]() {
        this.onDeactive();
    }
}
