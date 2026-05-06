import { BaseEntity } from '../@com';

const BaseServiceSymbol = Symbol('BaseService');

export abstract class BaseService<
    TEventMap extends LibTypes.BaseEventMap = never,
> extends BaseEntity<never, TEventMap> {
    public static readonly [BaseServiceSymbol]: typeof BaseServiceSymbol =
        BaseServiceSymbol;

    public readonly [BaseServiceSymbol]: typeof BaseServiceSymbol =
        BaseServiceSymbol;
}
