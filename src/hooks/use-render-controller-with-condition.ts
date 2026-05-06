import { type ReactNode, useContext, useMemo } from 'react';

import type { CoreTypes } from '$/types';
import { RouteFocusedHookContext, RouteHookContext } from '$/view';

import { useRenderControllerPointer } from './use-render-controller-pointer';
import { useZone } from './use-zone';

export const useRenderControllerWithCondition = <
    TControllerClass extends CoreTypes.RenderControllerClass,
>(
    parent: CoreTypes.RenderParent,
    condition: boolean,
    reactElement: ReactNode,
    Controller: CoreTypes.InferClassHasProps<TControllerClass> extends true
        ? never
        : TControllerClass,
) => {
    const zone = useZone();

    const useRouteFocused = useContext(RouteFocusedHookContext);
    const routeFocused = useRouteFocused();

    const useRoute = useContext(RouteHookContext);
    const route = useRoute();

    const { pointer, setter } = useRenderControllerPointer(parent, Controller, [
        condition,
    ]);

    useMemo(() => {
        if (!condition) {
            setter(pointer - 1);
        }
    }, [condition]);

    const ctrl: InstanceType<TControllerClass> | null = useMemo(() => {
        if (!condition) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const args = [
            {
                [Controller.RouteFocusedSymbol]: routeFocused,
                [Controller.RouteSymbol]: route,
            },
        ] as unknown as CoreTypes.InferCreateInstanceArgs<TControllerClass>;

        return zone.getOrCreateAndSetqueueRenderController(
            parent,
            Controller,
            pointer,
            ...args,
        );
    }, [condition]);

    return [condition && reactElement, ctrl] as const;
};
