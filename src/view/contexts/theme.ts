import { createContext } from 'react';
import { THEMES } from '$/consts';
import type { StyleTypes } from '$/types';

export const ThemeContext = createContext<StyleTypes.ThemeCreator>(THEMES.Default);
