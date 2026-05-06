import { useReactive, useRegisterRenderController } from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { AuthController } from './auth-controller';

export const withAuth = <T extends ReactTypes.FCForExtends>(Component: T) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    optimize((props => {
        const [ctrl, RenderParentProvider] =
            useRegisterRenderController(AuthController);
        const reactiveLoggedIn = useReactive(() => ctrl.state.loggedIn);

        return (
            <RenderParentProvider>
                {reactiveLoggedIn ? <Component {...props} /> : null}
            </RenderParentProvider>
        );
    }) as T);
