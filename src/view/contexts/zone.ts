import { createContext } from 'react';
import type { CoreTypes } from '$/types';

export const ZoneContext = createContext<CoreTypes.Zone | null>(null);
