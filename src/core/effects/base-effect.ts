import type { CoreTypes } from '$/types';

import { BaseEntity } from '../@com';

const BaseEffectSymbol = Symbol('BaseEffect');

export abstract class BaseEffect<
    TRef,
    TEventMap extends LibTypes.BaseEventMap = never,
    TOtherProps extends CoreTypes.Props = CoreTypes.Props,
> extends BaseEntity<CoreTypes.EffectProps<TRef, TOtherProps>, TEventMap> {
    public static readonly [BaseEffectSymbol]: typeof BaseEffectSymbol =
        BaseEffectSymbol;

    public readonly [BaseEffectSymbol]: typeof BaseEffectSymbol =
        BaseEffectSymbol;

    protected get ref() {
        return /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */ (
            this.props as unknown as CoreTypes.EffectProps<TRef>
        ).ref;
    }
}
