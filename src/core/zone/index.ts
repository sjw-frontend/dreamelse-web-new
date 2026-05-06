import { Container } from 'inversify';

import { AppError } from '$/errors';
import type { CoreTypes } from '$/types';

import { BaseRenderController } from '../models';

import { ZoneClassSet, getDesignParamtypes, onZoneClassRegister } from './@com';

type RenderContainerChildrenQueueMap = Map<
    CoreTypes.RenderControllerClass,
    LibTypes.VarDefine<{
        record: LibTypes.VarGeneralObj<Container>,
        head: number,
        tail: number,
    }>
>;

const RenderContainerChildrenQueueMapSymbol = Symbol(
    'RenderContainerChildrenQueueMap',
);
const RootContainerGetterSymbol = Symbol('rootContainerGetter');

export class Zone {
    public static readonly RootContainerGetterSymbol: typeof RootContainerGetterSymbol =
        RootContainerGetterSymbol;

    public constructor(rootContainer: Container) {
        this.#rootContainer = rootContainer;
    }

    readonly #rootContainer;

    public get [RootContainerGetterSymbol]() {
        return this.#rootContainer;
    }

    #getRenderParentContainer(parent: CoreTypes.RenderParent) {
        return (
            parent?.[BaseRenderController.ContainerGetterSymbol] ??
            this.#rootContainer
        );
    }

    #getRenderContainerChildrenQueueMap(container: Container) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return Reflect.getMetadata(
            RenderContainerChildrenQueueMapSymbol,
            container,
        ) as RenderContainerChildrenQueueMap | undefined;
    }

    #defineRenderContainerChildrenQueueMap(
        container: Container,
        map: RenderContainerChildrenQueueMap,
    ) {
        Reflect.defineMetadata(
            RenderContainerChildrenQueueMapSymbol,
            map,
            container,
        );
    }

    #enqueueOrSetRenderContainer(
        parent: Container,
        container: Container,
        Controller: CoreTypes.RenderControllerClass,
        pointer: number | null,
    ) {
        let map = this.#getRenderContainerChildrenQueueMap(parent);
        if (!map) {
            map = new Map();
            this.#defineRenderContainerChildrenQueueMap(parent, map);
        }

        let obj = map.get(Controller);
        if (!obj) {
            obj = {
                record: {},
                head: 0,
                tail: 0,
            };
            map.set(Controller, obj);
        }
        if (pointer != null) {
            if (pointer >= obj.head) {
                obj.record[pointer] = container;
            }
        } else {
            while (obj.record[obj.tail]) {
                obj.tail++;
            }
            obj.record[obj.tail++] = container;
        }
    }

    #getRenderController<T extends CoreTypes.RenderControllerClass>(
        parent: Container,
        Controller: T,
        pointer: number | null,
    ) {
        const map = this.#getRenderContainerChildrenQueueMap(parent);
        const obj = map?.get(Controller);

        const container = obj?.record[pointer ?? obj.head];

        return container?.get<InstanceType<T>>(Controller);
    }

    #getRenderControllerQueue<T extends CoreTypes.RenderControllerClass>(
        parent: Container,
        Controller: T,
    ) {
        const map = this.#getRenderContainerChildrenQueueMap(parent);
        const obj = map?.get(Controller);

        if (!obj) {
            return [];
        }
        const queue: LibTypes.VarArr<InstanceType<T>> = [];
        let pointer = obj.head;

        while (pointer < obj.tail) {
            const container = obj.record[pointer++];
            if (!container?.isCurrentBound(Controller)) {
                throw new AppError('getRenderControllerQueue获取实例失败');
            }
            queue.push(container.get<InstanceType<T>>(Controller));
        }

        return queue;
    }

    #bindToDynamicValue<T extends CoreTypes.EntityClass>(
        container: Container,
        Class: T,
        props: unknown,
    ) {
        return container.bind<InstanceType<T>>(Class).toDynamicValue(ctx => {
            const designParamtypes = getDesignParamtypes(Class);
            const ClassArgs = designParamtypes.map(item => ctx.get(item));
            if (props !== false) {
                Class[Class.CurrentPropsSymbol] = props ?? {};
            }
            Class[Class.CurrentZoneSymbol] = this;
            const ctrl = new Class(...ClassArgs);
            Class[Class.CurrentZoneSymbol] = undefined;
            if (BaseRenderController.ContainerGetterSymbol in ctrl) {
                ctrl[BaseRenderController.ContainerGetterSymbol] = container;
            }
            Class[Class.CurrentPropsSymbol] = {};
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            return ctrl as InstanceType<T>;
        });
    }

    #createRenderContainerAndBind<T extends CoreTypes.RenderControllerClass>(
        parent: Container,
        Controller: T,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) {
        const { props } = this.parseCreateRenderControllerArgs<T>(...args);

        const container = new Container({ parent });

        this.#bindToDynamicValue(
            container,
            Controller,
            props,
        ).inSingletonScope();

        return container;
    }

    public readonly parseCreateRenderControllerArgs = <
        T extends CoreTypes.RenderControllerClass,
    >(
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) => {
        const [arg0] = args;

        return {
            props: arg0,
        };
    };

    public readonly createAndSetqueueRenderController = <
        T extends CoreTypes.RenderControllerClass,
    >(
        parent: CoreTypes.RenderParent,
        Controller: T,
        pointer: number | null,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) => {
        const parentContainer = this.#getRenderParentContainer(parent);
        const container = this.#createRenderContainerAndBind(
            parentContainer,
            Controller,
            ...args,
        );
        this.#enqueueOrSetRenderContainer(
            parentContainer,
            container,
            Controller,
            pointer,
        );
        return container.get<InstanceType<T>>(Controller);
    };

    public readonly getRenderController = <
        T extends CoreTypes.RenderControllerClass,
    >(
        parent: CoreTypes.RenderParent,
        Controller: T,
        pointer: number | null,
    ) => {
        const parentContainer = this.#getRenderParentContainer(parent);

        const currentCtrl = this.#getRenderController(
            parentContainer,
            Controller,
            pointer,
        );

        return currentCtrl;
    };

    public readonly getOrCreateAndSetqueueRenderController = <
        T extends CoreTypes.RenderControllerClass,
    >(
        parent: CoreTypes.RenderParent,
        Controller: T,
        pointer: number | null,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) => {
        const currentCtrl = this.getRenderController(
            parent,
            Controller,
            pointer,
        );

        if (currentCtrl) {
            return currentCtrl;
        }

        return this.createAndSetqueueRenderController(
            parent,
            Controller,
            pointer,
            ...args,
        );
    };

    public readonly createAndEnqueueRenderController = <
        T extends CoreTypes.RenderControllerClass,
    >(
        parent: CoreTypes.RenderParent,
        Controller: T,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) => {
        const parentContainer = this.#getRenderParentContainer(parent);
        const container = this.#createRenderContainerAndBind(
            parentContainer,
            Controller,
            ...args,
        );
        this.#enqueueOrSetRenderContainer(
            parentContainer,
            container,
            Controller,
            null,
        );
        return container.get<InstanceType<T>>(Controller);
    };

    public readonly clearRenderController = (
        parent: CoreTypes.RenderParent,
        Controller: CoreTypes.RenderControllerClass,
        pointer: number,
    ) => {
        const parentContainer = this.#getRenderParentContainer(parent);

        const obj =
            this.#getRenderContainerChildrenQueueMap(parentContainer)?.get(
                Controller,
            );

        if (obj) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete obj.record[pointer];
        }
    };

    public readonly consumeRenderControlerQueue = <
        T extends CoreTypes.RenderControllerClass,
    >(
        parent: CoreTypes.RenderParent,
        Controller: T,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) => {
        const parentContainer = this.#getRenderParentContainer(parent);

        let obj =
            this.#getRenderContainerChildrenQueueMap(parentContainer)?.get(
                Controller,
            );
        if (!obj?.record[obj.head]) {
            this.createAndEnqueueRenderController(parent, Controller, ...args);
            obj =
                this.#getRenderContainerChildrenQueueMap(parentContainer)?.get(
                    Controller,
                );
        }

        if (!obj?.record[obj.head]) {
            throw new AppError('consumeRenderControlerQueue获取实例失败');
        }

        const container = obj.record[obj.head];
        const pointer = obj.head++;

        if (!container?.isCurrentBound(Controller)) {
            throw new AppError('consumeRenderControlerQueue获取实例失败');
        }

        return {
            pointer,
            ctrl: container.get<InstanceType<T>>(Controller),
        };
    };

    public readonly getRenderControllerQueue = <
        T extends CoreTypes.RenderControllerClass,
    >(
        parent: CoreTypes.RenderParent,
        Controller: T,
    ) =>
        this.#getRenderControllerQueue(
            this.#getRenderParentContainer(parent),
            Controller,
        );

    public readonly getOrCreateHeadRenderController = <
        T extends CoreTypes.RenderControllerClass,
    >(
        parent: CoreTypes.RenderParent,
        Controller: T,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) =>
        this.getRenderControllerQueue(parent, Controller)[0] ??
        this.createAndEnqueueRenderController(parent, Controller, ...args);

    public readonly getDomain = <T extends CoreTypes.DomainClass>(
        Domain: T,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) => {
        if (!this.#rootContainer.isBound(Domain)) {
            this.#bindToDynamicValue(
                this.#rootContainer,
                Domain,
                false,
            ).inTransientScope();
        }

        Domain[Domain.CurrentPropsSymbol] = args[0] ?? {};
        return this.#rootContainer.get<InstanceType<T>>(Domain);
    };

    public readonly getEffect = <T extends CoreTypes.EffectClass>(
        Effect: T,
        ...args: CoreTypes.InferCreateInstanceArgs<T>
    ) => {
        if (!this.#rootContainer.isBound(Effect)) {
            this.#bindToDynamicValue(
                this.#rootContainer,
                Effect,
                false,
            ).inTransientScope();
        }

        Effect[Effect.CurrentPropsSymbol] = args[0] ?? {};
        return this.#rootContainer.get<InstanceType<T>>(Effect);
    };

    public readonly getReport = <T extends CoreTypes.ReportClass>(
        Report: T,
        props: CoreTypes.InferClassProps<T>,
    ) => {
        if (!this.#rootContainer.isBound(Report)) {
            this.#bindToDynamicValue(
                this.#rootContainer,
                Report,
                false,
            ).inTransientScope();
        }

        Report[Report.CurrentPropsSymbol] = props;
        return this.#rootContainer.get<InstanceType<T>>(Report);
    };

    public readonly getZoneController = <
        T extends CoreTypes.ZoneControllerClass,
    >(
        Controller: T,
    ) => this.#rootContainer.get<InstanceType<T>>(Controller);

    public readonly getService = <T extends CoreTypes.ServiceClass>(
        Service: T,
    ) => this.#rootContainer.get<InstanceType<T>>(Service);
}

const bindZoneClass = (
    zone: Zone,
    container: Container,
    ZoneClass: CoreTypes.ZoneClass,
) => {
    container
        .bind<CoreTypes.Service | CoreTypes.ZoneController>(ZoneClass)
        .toDynamicValue(ctx => {
            const designParamtypes = getDesignParamtypes(ZoneClass);
            const ClassArgs = designParamtypes.map(item => ctx.get(item));
            ZoneClass[ZoneClass.CurrentZoneSymbol] = zone;
            const ctrl = new ZoneClass(...ClassArgs);
            ZoneClass[ZoneClass.CurrentZoneSymbol] = undefined;
            return ctrl;
        })
        .inSingletonScope();
    container.get(ZoneClass);
};

export const createZone = () => {
    const rootContainer = new Container();

    const zone = new Zone(rootContainer);

    ZoneClassSet.forEach(ZoneClass =>
        bindZoneClass(zone, rootContainer, ZoneClass));
    onZoneClassRegister(
        ZoneClass =>
            !rootContainer.isBound(ZoneClass) &&
            bindZoneClass(zone, rootContainer, ZoneClass),
    );

    return zone;
};

export * from './decorator';
