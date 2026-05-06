import { useContext, useEffect, useMemo } from 'react';

import { BaseRenderController, getControllerDecorateOptions } from '$/core';
import type { CoreTypes, ReactTypes } from '$/types';

import {
    OverrideStateHookContext,
    RenderParentContext,
    RouteFocusedHookContext,
    RouteHookContext,
} from '../view/contexts';

import { useZone } from './use-zone';

const useConsumeRenderController = <T extends CoreTypes.RenderControllerClass>(
    Controller: T,
    ...args: CoreTypes.InferCreateInstanceArgs<T>
) => {
    const zone = useZone();

    const options = getControllerDecorateOptions(Controller);
    if (options?.scope !== 'render') {
        throw new Error(
            'useConsumeRenderController 只能用于 scope=render 的Controller',
        );
    }

    const parent = useContext(RenderParentContext);

    const useRouteFocused = useContext(RouteFocusedHookContext);
    const routeFocused = useRouteFocused();

    const useRoute = useContext(RouteHookContext);
    const route = useRoute();

    (args as LibTypes.VarArr)[0] = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        ...(args[0] as LibTypes.Reference),
        [BaseRenderController.RouteFocusedSymbol]: routeFocused,
        [BaseRenderController.RouteSymbol]: route,
    };

    const { ctrl, pointer } = useMemo(
        () => zone.consumeRenderControlerQueue(parent, Controller, ...args),
        [],
    );

    const useOverrideState = useContext(OverrideStateHookContext);
    useOverrideState(Controller, ctrl);

    useMemo(
        () => ctrl[BaseRenderController.RouteFocusedSymbol](routeFocused),
        [routeFocused],
    );

    useMemo(() => ctrl[BaseRenderController.RouteSymbol](route), [route]);

    useEffect(() => {
        ctrl[BaseRenderController.OnMountSymbol]();
        return () => {
            ctrl[BaseRenderController.OnUnmountSymbol]();
            zone.clearRenderController(parent, Controller, pointer);
        };
    }, []);

    return ctrl;
};

/**
 * - Controller 不允许修改
 * - 尽可能少用props
 *      - 一般只用于传必要的初始化参数，如id。
 *      - 不要传其它由本框架管理的实例，如controller和service
 */
export const useRegisterRenderController = <
    T extends CoreTypes.RenderControllerClass,
>(
    Controller: T,
    ...args: CoreTypes.InferCreateInstanceArgs<T>
) => {
    const ctrl = useConsumeRenderController(Controller, ...args);

    const RenderParentProvider = useMemo(
        (): ReactTypes.FCWC => p => (
            <RenderParentContext value={ctrl}>{p.children}</RenderParentContext>
        ),
        [],
    );

    return [ctrl, RenderParentProvider] as const;
};
