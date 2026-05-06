import { useContext, useEffect, useMemo } from 'react';

import { BaseZoneController, getControllerDecorateOptions } from '$/core';
import type { CoreTypes } from '$/types';

import { OverrideStateHookContext } from '../view/contexts';

import { useZone } from './use-zone';

type EffectInfo = LibTypes.VarDefine<{
    rc: number,
}>;

const zoneCtrlMap = new WeakMap<
    CoreTypes.Zone,
    WeakMap<CoreTypes.ZoneController, EffectInfo>
>();

/**
 * - Controller 不允许修改
 */
export const useZoneController = <T extends CoreTypes.ZoneControllerClass>(
    Controller: T,
) => {
    const options = getControllerDecorateOptions(Controller);
    if (options?.scope !== 'zone') {
        throw new Error('useZoneController 只能用于 scope=zone 的Controller');
    }

    const zone = useZone();
    const ctrl = useMemo(() => zone.getZoneController(Controller), []);

    const useOverrideState = useContext(OverrideStateHookContext);
    useOverrideState(Controller, ctrl);

    useEffect(() => {
        let ctrlMap = zoneCtrlMap.get(zone);

        if (!ctrlMap) {
            ctrlMap = new WeakMap();
            zoneCtrlMap.set(zone, ctrlMap);
        }

        let info = ctrlMap.get(ctrl);
        if (!info) {
            info = { rc: 0 };
            ctrlMap.set(ctrl, info);
        }

        if (info.rc === 0) {
            ctrl[BaseZoneController.OnActiveSymbol]();
        }
        info.rc++;

        return () => {
            info.rc--;
            if (info.rc === 0) {
                ctrl[BaseZoneController.OnDeactiveSymbol]();
            }
        };
    }, []);

    return ctrl;
};
