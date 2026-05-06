import { type ReactNode, useEffect, useMemo } from 'react';

import { AppError } from '$/errors';
import type { CoreTypes } from '$/types';

import { useRenderControllerPointer } from './use-render-controller-pointer';
import { useZone } from './use-zone';

export const useRenderControllerEffectWithCondition = <
    TControllerClass extends CoreTypes.RenderControllerClass,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    TCallback extends LibTypes.LooseArgumentsFunc<
        void,
        [ctrl: InstanceType<TControllerClass> | null]
    >,
>(
    parent: CoreTypes.RenderParent,
    condition: boolean,
    reactElement: ReactNode,
    Controller: TControllerClass,
    cb: TCallback,
) => {
    const zone = useZone();

    const { pointer, setter } = useRenderControllerPointer(parent, Controller, [
        condition,
    ]);

    useMemo(() => {
        if (!condition) {
            setter(pointer - 1);
        }
    }, [condition]);

    useEffect(() => {
        if (condition) {
            const ctrl = zone.getRenderController(parent, Controller, pointer);
            if (!ctrl) {
                throw new AppError(
                    'useRenderControllerEffectWithCondition Error',
                );
            }
            cb(ctrl);
        } else {
            cb(null);
        }
    }, [condition]);

    return <>{condition && reactElement}</>;
};
