import type { CoreTypes } from '$/types';

import {
    DecorateSymbol,
    ZoneClassRegisterCallbacks,
    ZoneClassSet,
    decorateController,
    decorateDomain,
    decorateEffect,
    decorateReport,
    decorateService,
} from './@com';

export { withReport } from './@com';

export const report =
    () =>
    <T extends CoreTypes.ReportClass>(Report: T) => {
        const options: CoreTypes.ReportDecorateOptions = {
            scope: 'custom',
        };
        const ReactiveReport = decorateReport(Report, options);

        return ReactiveReport;
    };

export const domain =
    () =>
    <T extends CoreTypes.DomainClass>(Domain: T) => {
        const options: CoreTypes.DomainDecorateOptions = {
            scope: 'custom',
        };
        const ReactiveDomain = decorateDomain(Domain, options);

        return ReactiveDomain;
    };

export const renderController =
    () =>
    <T extends CoreTypes.RenderControllerClass>(RenderController: T) => {
        const options: CoreTypes.ControllerDecorateOptions = {
            scope: 'render',
        };
        const ReactiveRenderController = decorateController(
            RenderController,
            options,
        );

        return ReactiveRenderController;
    };

export const zoneController =
    () =>
    <T extends CoreTypes.ZoneControllerClass>(ZoneController: T) => {
        const options: CoreTypes.ControllerDecorateOptions = {
            scope: 'zone',
        };
        const ReactiveZoneController = decorateController(
            ZoneController,
            options,
        );

        ZoneClassRegisterCallbacks.forEach(cb => cb(ReactiveZoneController));
        ZoneClassSet.add(ReactiveZoneController);

        return ReactiveZoneController;
    };

export const effect = () => (Effect: CoreTypes.EffectClass) => {
    const options: CoreTypes.EffectDecorateOptions = {
        scope: 'custom',
    };
    decorateEffect(Effect, options);
};

export const service = () => (Service: CoreTypes.ServiceClass) => {
    const options: CoreTypes.ServiceDecorateOptions = {
        scope: 'zone',
    };
    decorateService(Service, options);

    ZoneClassRegisterCallbacks.forEach(cb => cb(Service));
    ZoneClassSet.add(Service);
};

export const getControllerDecorateOptions = (
    Controller: CoreTypes.ControllerClass,
) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const options = Reflect.getMetadata(DecorateSymbol, Controller) as
        | CoreTypes.ControllerDecorateOptions
        | undefined;

    return options;
};

export const getServiceDecorateOptions = (Service: CoreTypes.ServiceClass) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const options = Reflect.getMetadata(DecorateSymbol, Service) as
        | CoreTypes.ServiceDecorateOptions
        | undefined;

    return options;
};
