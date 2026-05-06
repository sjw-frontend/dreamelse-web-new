import { useMemo } from 'react';

import { BaseRenderController, Zone } from '$/core';
import type { CoreTypes } from '$/types';

import { useZone } from './use-zone';

export const useProvideRenderController = (
    parent: CoreTypes.RenderController | null,
    ctrl: CoreTypes.RenderController,
) => {
    const zone = useZone();

    useMemo(() => {
        const container =
            parent?.[BaseRenderController.ContainerGetterSymbol] ??
            zone[Zone.RootContainerGetterSymbol];

        if (!container.isBound(ctrl.constructor)) {
            container
                .bind<CoreTypes.RenderController>(ctrl.constructor)
                .toConstantValue(ctrl);
        }
    }, [ctrl, parent]);
};
