// @ts-nocheck
import { type ServiceIdentifier, decorate, injectable } from 'inversify';

import type { CoreTypes } from '$/types';
import { EventUtils } from '$/utils';

const createReactiveModel = <T extends CoreTypes.ModelClass>(Model: T) => Model;

export const withReport =
    <TReport extends CoreTypes.ReportClass>(Report: TReport) =>
    <T extends LibTypes.Class<CoreTypes.InferClassProps<TReport>['target']>>(
        Model: T,
    ) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const Base = Model as unknown as CoreTypes.ModelClass;
        class ReportedModel extends Base {
            public static override get name() {
                return Base.name;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            public constructor(...args: LibTypes.Arr<any>) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                super(...args);

                const originalCallEvents =
                    EventUtils.createOriginalCallEvents(this);
                this.#originalCallEvents = originalCallEvents;
                this[Base.ReportInstanceSymbol] = this[
                    Base.ZoneGetterSymbol
                ].getReport(
                    Report,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    {
                        target: this,
                        originalCallEvents, // TODO 类型不安全
                    } as CoreTypes.InferClassProps<TReport>,
                );
            }

            readonly #originalCallEvents;

            // TODO 看如何省略这个定义
            declare protected readonly getInitialInternalState: () => CoreTypes.ModelState;

            protected override destroy() {
                super.destroy();
                this.#originalCallEvents.removeAllEventListeners();
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return ReportedModel as unknown as T;
    };

export const DecorateSymbol = Symbol('decorate');

export const decorateDomain = <T extends CoreTypes.DomainClass>(
    Domain: T,
    options: CoreTypes.DomainDecorateOptions,
): T => {
    const ReactiveDomain = createReactiveModel(Domain);

    decorate(injectable(), ReactiveDomain);
    Reflect.defineMetadata(DecorateSymbol, options, ReactiveDomain);

    return ReactiveDomain;
};

export const decorateController = <T extends CoreTypes.ControllerClass>(
    Controller: T,
    options: CoreTypes.ControllerDecorateOptions,
): T => {
    const ReactiveController = createReactiveModel(Controller);

    decorate(injectable(), ReactiveController);
    Reflect.defineMetadata(DecorateSymbol, options, ReactiveController);

    return ReactiveController;
};

export const decorateEffect = (
    Effect: CoreTypes.EffectClass,
    options: CoreTypes.EffectDecorateOptions,
) => {
    decorate(injectable(), Effect);
    Reflect.defineMetadata(DecorateSymbol, options, Effect);
};

export const decorateService = (
    Service: CoreTypes.ServiceClass,
    options: CoreTypes.ServiceDecorateOptions,
) => {
    decorate(injectable(), Service);
    Reflect.defineMetadata(DecorateSymbol, options, Service);
};

export const decorateReport = <T extends CoreTypes.ReportClass>(
    Report: T,
    options: CoreTypes.ReportDecorateOptions,
): T => {
    decorate(injectable(), Report);
    Reflect.defineMetadata(DecorateSymbol, options, Report);

    return Report;
};

const DesignParamtypesKey = 'design:paramtypes';
export const getDesignParamtypes = (TargetClass: LibTypes.Class) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (Reflect.getMetadata(DesignParamtypesKey, TargetClass) as
        | LibTypes.Arr<ServiceIdentifier>
        | undefined) ?? [];

type Callback = (ZoneClass: CoreTypes.ZoneClass) => void;

export const ZoneClassSet = new Set<CoreTypes.ZoneClass>();

export const ZoneClassRegisterCallbacks: LibTypes.VarArr<Callback> = [];

export const onZoneClassRegister = (callback: Callback) =>
    ZoneClassRegisterCallbacks.push(callback);
