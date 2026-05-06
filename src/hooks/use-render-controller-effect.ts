// @ts-nocheck
import { useEffect } from 'react';

import { AppError } from '$/errors';
import type { CoreTypes } from '$/types';

import { useRenderControllerPointers } from './use-render-controller-pointer';
import { useZone } from './use-zone';

/** parent 和 Controller 不能变 */
export const useRenderControllerEffect = <
    const TControllerClass extends
        | CoreTypes.RenderControllerClass
        | LibTypes.Arr<CoreTypes.RenderControllerClass>,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    TCallback extends TControllerClass extends CoreTypes.RenderControllerClass
        ? (ctrl: InstanceType<TControllerClass>) => void
        : TControllerClass extends LibTypes.Arr<CoreTypes.RenderControllerClass>
          ? (
                ctrlList: LibTypes.ConstructorTupleToInstance<TControllerClass>,
            ) => void
          : never,
>(
    parent: CoreTypes.RenderParent,
    Controller: TControllerClass,
    cb: TCallback,
) => {
    const zone = useZone();

    const Controllers: LibTypes.Arr<CoreTypes.RenderControllerClass> =
        Controller instanceof Array ? Controller : [Controller];

    const pointerResultList = useRenderControllerPointers(
        parent,
        Controllers,
        [],
    );

    useEffect(() => {
        const ctrlList = Controllers.map((Ctrl, index) => {
            const pointerResult = pointerResultList[index];
            if (pointerResult == null) {
                throw new AppError(
                    'useRenderControllerEffect Error pointerResult',
                );
            }
            const ctrl = zone.getRenderController(
                parent,
                Ctrl,
                pointerResult.pointer,
            );
            if (!ctrl) {
                throw new AppError('useRenderControllerEffect Error ctrl');
            }

            return ctrl;
        });

        const cbParam = Controller instanceof Array ? ctrlList : ctrlList[0];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
        cb(cbParam as any); // TODO 研究一下怎么可以不用any
    }, []);
};
