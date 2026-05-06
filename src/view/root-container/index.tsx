import { THEMES } from '$/consts';
import type { ReactTypes } from '$/types';
import { ThemeContext } from '../contexts';
import { LayoutRoot } from './@parts/layout-root';

export const RootContainer: ReactTypes.FCWC = ({ children }) => (
    <ThemeContext value={THEMES.Default}>
        <LayoutRoot>{children}</LayoutRoot>
    </ThemeContext>
);
