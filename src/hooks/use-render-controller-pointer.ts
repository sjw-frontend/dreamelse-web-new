import type { Container } from 'inversify';
import { type DependencyList, useEffect, useMemo } from 'react';

import { Zone } from '$/core';
import type { CoreTypes } from '$/types';

import { useZone } from './use-zone';

type Result = LibTypes.FrozenDefine<{
    pointer: number,
    setter: (value: number) => void,
}>;

const pointerMap = new WeakMap<
    Container | CoreTypes.RenderController,
    WeakMap<CoreTypes.RenderControllerClass, number>
>();

export const useRenderControllerPointer = (
    parent: CoreTypes.RenderParent,
    Controller: CoreTypes.RenderControllerClass,
    deps: DependencyList,
) => {
    const zone = useZone();
    const key = parent ?? zone[Zone.RootContainerGetterSymbol];

    useEffect(
        () => () => {
            pointerMap.delete(key);
        },
        [],
    );

    return useMemo<Result>(() => {
        const controllerMap =
            pointerMap.get(key) ??
            new WeakMap<CoreTypes.RenderControllerClass, number>();
        pointerMap.set(key, controllerMap);
        let pointer = controllerMap.get(Controller) ?? -1;
        pointer++;
        controllerMap.set(Controller, pointer);

        const setter = (value: number) => {
            controllerMap.set(Controller, value);
        };

        return { pointer, setter };
    }, deps);
};

export const useRenderControllerPointers = (
    parent: CoreTypes.RenderParent,
    Controllers: LibTypes.Arr<CoreTypes.RenderControllerClass>,
    deps: DependencyList,
) => {
    const zone = useZone();
    const key = parent ?? zone[Zone.RootContainerGetterSymbol];

    useEffect(
        () => () => {
            pointerMap.delete(key);
        },
        [],
    );

    return useMemo<LibTypes.Arr<Result>>(() => {
        const list: LibTypes.VarArr<Result> = [];

        const controllerMap =
            pointerMap.get(key) ??
            new WeakMap<CoreTypes.RenderControllerClass, number>();
        pointerMap.set(key, controllerMap);

        Controllers.forEach(Controller => {
            let pointer = controllerMap.get(Controller) ?? -1;
            pointer++;
            controllerMap.set(Controller, pointer);

            const setter = (value: number) => {
                controllerMap.set(Controller, value);
            };

            list.push({ pointer, setter });
        });

        return list;
    }, deps);
};
