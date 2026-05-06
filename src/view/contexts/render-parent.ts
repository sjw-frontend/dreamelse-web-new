import { createContext } from 'react';
import type { CoreTypes } from '$/types';

export const RenderParentContext = createContext<CoreTypes.RenderController | null>(null);
