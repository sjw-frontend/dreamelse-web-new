// src/hooks/use-theme.ts
import { useContext } from 'react';
import { ThemeContext } from '$/view/contexts/theme';

export const useTheme = () => {
    const themeCreator = useContext(ThemeContext);
    return themeCreator();
};
