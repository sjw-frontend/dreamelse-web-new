import { useContext, useMemo } from 'react';

import type { CoreTypes } from '$/types';
import { RouteFocusedHookContext, RouteHookContext } from '$/view';

import { useRenderControllerPointer } from './use-render-controller-pointer';
import { useZone } from './use-zone';

export const useRenderController = <T extends CoreTypes.RenderControllerClass>(
    parent: CoreTypes.RenderParent,
    Controller: CoreTypes.InferClassHasProps<T> extends true ? never : T,
) => {
    const zone = useZone();

    const useRouteFocused = useContext(RouteFocusedHookContext);
    const routeFocused = useRouteFocused();

    const useRoute = useContext(RouteHookContext);
    const route = useRoute();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const args = [
        {
            [Controller.RouteFocusedSymbol]: routeFocused,
            [Controller.RouteSymbol]: route,
        },
    ] as unknown as CoreTypes.InferCreateInstanceArgs<T>;

    const { pointer } = useRenderControllerPointer(parent, Controller, []);

    const ctrl = useMemo(
        () =>
            zone.getOrCreateAndSetqueueRenderController(
                parent,
                Controller,
                pointer,
                ...args,
            ),
        [],
    );
    return ctrl;
};
