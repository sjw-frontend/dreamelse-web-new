import { createContext } from 'react';
import type { CoreTypes } from '$/types';

export const OverrideStateHookContext = createContext<
    <T extends CoreTypes.ControllerClass>(
        Controller: T,
        ctrl: InstanceType<T>,
    ) => void
>(() => {});
