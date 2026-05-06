import { useInjectRenderController } from '$/hooks';
import { optimize } from '$/view';
import { RouterEnums } from '$/enums';
import { ASSETS } from '$/consts';
import { NavbarController } from '../navbar-controller';
import { BarButton } from './bar-button';

const AddIcon = () => (
    <svg width="52" height="36" viewBox="0 0 52 36" fill="none">
        <rect x="1" y="1" width="50" height="34" rx="10" fill="var(--color-accent)" />
        <path d="M26 12v12M20 18h12" stroke="var(--color-bg-page)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
);

export const ButtonGroup = optimize(() => {
    const ctrl = useInjectRenderController(NavbarController);

    return (
        <>
            <BarButton
                routeName={RouterEnums.RouteName.Home}
                icon={<img src={ASSETS.Navbar.home} alt="home" className="w-7 h-7" />}
                focusIcon={<img src={ASSETS.Navbar.homeFocus} alt="home" className="w-7 h-7" />}
                onPress={ctrl.toHome}
            />
            <BarButton
                routeName={RouterEnums.RouteName.CharacterCreate}
                icon={<AddIcon />}
                onPress={ctrl.openOverlay}
                large
            />
            <BarButton
                routeName={RouterEnums.RouteName.CharacterList}
                icon={<img src={ASSETS.Navbar.character} alt="characters" className="w-7 h-7" />}
                focusIcon={<img src={ASSETS.Navbar.characterFocus} alt="characters" className="w-7 h-7" />}
                onPress={ctrl.toCharacterList}
            />
        </>
    );
});
