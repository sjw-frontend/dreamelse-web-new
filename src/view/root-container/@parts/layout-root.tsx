import type { ReactTypes } from '$/types';
import { useProvideRenderController, useRenderController } from '$/hooks';
import { optimize } from '../../optimize';
import { useInitialPopup } from '../@com';
import { PopupHelperContext } from '../../contexts';
import { NavbarController } from '../../components/@controllers';
import { Navbar } from '../../components/navbar/navbar-ui';
import { GlobalEffects } from './global-effects';
import { Popup } from './popup';

export const LayoutRoot: ReactTypes.FCWC = optimize(({ children }) => {
    const navbarController = useRenderController(null, NavbarController);
    useProvideRenderController(null, navbarController);

    const popup = useInitialPopup();

    return (
        <PopupHelperContext value={popup.helper}>
            <GlobalEffects />
            <div className="flex flex-col h-full relative">
                {children}
            </div>
            <Popup {...popup.state} />
            <Navbar />
        </PopupHelperContext>
    );
});
