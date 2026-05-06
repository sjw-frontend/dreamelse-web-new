// web版：use-navbar-rect-state 直接从 NavbarController 读取 rect（无变化）
import { NavbarController } from '../view/components/navbar/navbar-controller';
import { useInjectRenderController } from './use-inject-render-controller';

export const useNavbarRectState = () => {
    const ctrl = useInjectRenderController(NavbarController);
    return ctrl.state.rect;
};
