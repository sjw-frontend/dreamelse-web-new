import { createContext } from 'react';
import type { CoreTypes } from '$/types';

export const RouteFocusedHookContext = createContext<
    LibTypes.Func<CoreTypes.RenderPresetsState['routeFocused'] & {}>
>(() => 'never');
