import { createContext } from 'react';
import type { StyleTypes } from '$/types';

export const OverrideStylesHookContext = createContext<
    <T extends StyleTypes.Styles>(
        styles: T,
        stylesCreator: StyleTypes.StylesCreator,
    ) => T
>(styles => styles);
