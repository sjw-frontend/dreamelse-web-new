import { createContext } from 'react';
import type { RouterTypes } from '$/types';

export const RouteHookContext = createContext<
    LibTypes.Func<RouterTypes.Route | null>
>(() => null);
