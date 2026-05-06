import type {
    BaseController,
    BaseDomain,
    BaseEffect,
    BaseModel,
    BaseRenderController,
    BaseReport,
    BaseService,
    BaseZoneController,
    Zone as _Zone,
} from '$/core';

import type { BaseEntity } from '../core/@com';

import type { RouterTypes } from './router';

type _InferProps<P> = P extends Readonly<infer R> ? R : P;

type _InferCreateInstanceArgs<
    TEntityClass extends CoreTypes.EntityClass,
    TOtherArgs extends LibTypes.Arr = [],
    TProps extends CoreTypes.InferClassProps<TEntityClass> =
        CoreTypes.InferClassProps<TEntityClass>,
> =
    LibTypes.IsExplicit<TProps> extends false
        ? [props?: TProps, ...TOtherArgs]
        : LibTypes.IsPartialObject<TProps> extends true
          ? [props?: TProps, ...TOtherArgs]
          : [props: TProps, ...TOtherArgs];

export declare namespace CoreTypes {
    type Zone = _Zone;

    type Props = LibTypes.FrozenGeneralObj;

    type ModelState = LibTypes.FrozenGeneralObj;

    type InferClassProps<T extends EntityClass> = InferProps<InstanceType<T>>;

    type InferClassHasProps<T extends EntityClass> = LibTypes.IsExplicit<
        InferProps<InstanceType<T>>
    >;

    type InferProps<T extends Entity> = _InferProps<
        T[EntityClass['PropsGetterSymbol']]
    >;

    type InferEventMap<T extends Entity> =
        T extends Entity<Props, infer E> ? E : never;

    type InferModelInternalState<T extends Model> = _InferProps<
        T[ModelClass['InternalStateSymbol']]
    >;

    type ZoneClass = ServiceClass | ZoneControllerClass;

    type InferCreateInstanceArgs<
        TEntityClass extends EntityClass,
        TOtherArgs extends LibTypes.Arr = [],
    > = _InferCreateInstanceArgs<TEntityClass, TOtherArgs>;

    type RenderParent = RenderController | null;

    type ModelPresetsState = LibTypes.VarDefine<{
        pending?: boolean,
    }>;

    type RenderPresetsState = LibTypes.VarDefine<{
        routeFocused?: boolean | 'never',
        /** route.params 是 shallowReactive */
        route?: LibTypes.DefinePick<
            RouterTypes.Route,
            'key' | 'name' | 'params'
        > | null,
        mounted?: boolean,
        unmounted?: true,
        readyToDisplay?: 'ineffective' | true,
    }>;

    type ScopeKind = 'global' | 'zone';

    type DecorateOptions<T extends string> = LibTypes.FrozenDefine<{
        scope?: T,
    }>;
}

export declare namespace CoreTypes {
    type BaseEntityClass = typeof BaseEntity;
    type BaseEntityClassStatic = LibTypes.ClassStaticFields<BaseEntityClass>;
    type Entity<
        TProps extends Props = Props,
        TEventMap extends LibTypes.BaseEventMap = LibTypes.BaseEventMap,
    > = BaseEntity<TProps, TEventMap>;
    type EntityClass = BaseEntityClassStatic & LibTypes.Class<Entity>;
}

export declare namespace CoreTypes {
    type ServiceScopeKind = ScopeKind;

    type ServiceDecorateOptions = DecorateOptions<ServiceScopeKind>;

    type BaseServiceClass = typeof BaseService;
    type BaseServiceClassStatic = LibTypes.ClassStaticFields<BaseServiceClass>;
    type Service = BaseService;
    type ServiceClass = BaseServiceClassStatic & LibTypes.Class<Service>;
}

export declare namespace CoreTypes {
    type DefaultEffectProps<T> = LibTypes.FrozenDefine<
        {
            ref: T,
        },
        'ref'
    >;

    type EffectProps<T, TOther extends Props = Props> = LibTypes.Define<
        LibTypes.Assign<
            LibTypes.InferGeneralObjDefaultTypeParam<TOther>,
            DefaultEffectProps<T>
        >
    >;

    type EffectScopeKind = 'custom';

    type EffectDecorateOptions = DecorateOptions<EffectScopeKind>;

    type BaseEffectClass = typeof BaseEffect;
    type BaseEffectClassStatic = LibTypes.ClassStaticFields<BaseEffectClass>;
    type Effect<T = unknown> = BaseEffect<T>;
    type EffectClass = BaseEffectClassStatic & LibTypes.Class<Effect>;
}

export declare namespace CoreTypes {
    type BaseModelClass = typeof BaseModel;
    type BaseModelClassStatic = LibTypes.ClassStaticFields<BaseModelClass>;
    type Model<
        TState extends ModelState = ModelState,
        TInternalState extends TState = TState,
        TEventMap extends LibTypes.BaseEventMap = LibTypes.BaseEventMap,
        TProps extends Props = Props,
        TPresetsState extends LibTypes.FrozenGeneralObj =
            LibTypes.FrozenGeneralObj,
    > = BaseModel<TState, TInternalState, TEventMap, TProps, TPresetsState>;
    type ModelClass = BaseModelClassStatic & LibTypes.Class<Model>;
}

export declare namespace CoreTypes {
    type DomainScopeKind = 'custom';

    type DomainDecorateOptions = DecorateOptions<DomainScopeKind>;

    type BaseDomainClass = typeof BaseDomain;
    type BaseDomainClassStatic = LibTypes.ClassStaticFields<BaseDomainClass>;
    type Domain<
        TState extends ModelState = ModelState,
        TInternalState extends TState = TState,
        TEventMap extends LibTypes.BaseEventMap = LibTypes.BaseEventMap,
        TProps extends Props = Props,
    > = BaseDomain<TState, TInternalState, TEventMap, TProps>;
    type DomainClass = BaseDomainClassStatic & LibTypes.Class<Domain>;
}

export declare namespace CoreTypes {
    type ReportProps<
        TModelInstance extends Model = Model,
        TEventName extends string = never,
    > = LibTypes.FrozenDefine<{
        target: TModelInstance,
        originalCallEvents: LibTypes.VarPick<
            LibTypes.EventsDefine<
                LibTypes.OriginalCallEventMap<TModelInstance, TEventName>
            >,
            | 'addEventListener'
            | 'removeAllEventListeners'
            | 'removeEventListener'
        >,
    }>;

    type ReportScopeKind = 'custom';

    type ReportDecorateOptions = DecorateOptions<ReportScopeKind>;

    type BaseReportClass = typeof BaseReport;
    type BaseReportClassStatic = LibTypes.ClassStaticFields<BaseReportClass>;
    type Report<
        TModelInstance extends Model = Model,
        TEventName extends string = never,
    > = BaseReport<TModelInstance, TEventName>;
    type ReportClass = BaseReportClassStatic & LibTypes.Class<Report>;
}

export declare namespace CoreTypes {
    type ControllerScopeKind = ScopeKind | 'render';

    type ControllerDecorateOptions = DecorateOptions<ControllerScopeKind>;

    type BaseControllerClass = typeof BaseController;
    type BaseControllerClassStatic =
        LibTypes.ClassStaticFields<BaseControllerClass>;
    type Controller<
        TState extends ModelState = ModelState,
        TInternalState extends TState = TState,
        TEventMap extends LibTypes.BaseEventMap = LibTypes.BaseEventMap,
        TProps extends Props = Props,
        TPresetsState extends LibTypes.FrozenGeneralObj =
            LibTypes.FrozenGeneralObj,
    > = BaseController<
        TState,
        TInternalState,
        TEventMap,
        TProps,
        TPresetsState
    >;
    type ControllerClass = BaseControllerClassStatic &
        LibTypes.Class<Controller>;

    type BaseRenderControllerClass = typeof BaseRenderController;
    type BaseRenderControllerClassStatic =
        LibTypes.ClassStaticFields<BaseRenderControllerClass>;
    type RenderController<
        TState extends ModelState = ModelState,
        TInternalState extends TState = TState,
        TEventMap extends LibTypes.BaseEventMap = LibTypes.BaseEventMap,
        TProps extends Props = Props,
    > = BaseRenderController<TState, TInternalState, TEventMap, TProps>;
    type RenderControllerClass = BaseRenderControllerClassStatic &
        LibTypes.Class<RenderController>;

    type BaseZoneControllerClass = typeof BaseZoneController;
    type BaseZoneControllerClassStatic =
        LibTypes.ClassStaticFields<BaseZoneControllerClass>;
    type ZoneController<
        TState extends ModelState = ModelState,
        TInternalState extends TState = TState,
    > = BaseZoneController<TState, TInternalState>;
    type ZoneControllerClass = BaseZoneControllerClassStatic &
        LibTypes.Class<ZoneController>;
}
