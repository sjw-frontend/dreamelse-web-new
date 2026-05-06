// @ts-nocheck
import { useContext } from 'react';

import { Zone } from '$/core';
import type { CoreTypes } from '$/types';

import { RenderParentContext } from '../view/contexts';

import { useZone } from './use-zone';

export const useInjectRenderController = <
    T extends CoreTypes.RenderControllerClass,
>(
    Controller: T,
) => {
    const zone = useZone();

    const ctrl = useContext(RenderParentContext);
    const container =
        ctrl?.[Controller.ContainerGetterSymbol] ??
        zone[Zone.RootContainerGetterSymbol];

    if (!container.isBound(Controller)) {
        throw new Error('未提供有效容器');
    }

    return container.get<InstanceType<T>>(Controller);
};
