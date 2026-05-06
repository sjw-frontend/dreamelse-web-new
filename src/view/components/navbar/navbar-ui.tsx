import { useCallback } from 'react';
import { useRegisterRenderController, useReactive } from '$/hooks';
import { optimize } from '$/view';
import { NavbarController } from './navbar-controller';
import { ButtonGroup, CreateOptionsOverlay } from './@parts';

export const Navbar = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(NavbarController);

    const state = useReactive(() => ({ enabled: ctrl.state.enabled }));

    const onLayout = useCallback((el: HTMLDivElement | null) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        ctrl.onLayout({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    }, [ctrl]);

    return (
        <RenderParentProvider>
            {state.enabled && (
                <div
                    ref={onLayout}
                    className="absolute left-0 right-0 bottom-0 z-low flex flex-row items-stretch justify-around bg-bg-page"
                    style={{ height: 56, paddingTop: 8, paddingLeft: 16, paddingRight: 16 }}
                >
                    <ButtonGroup />
                </div>
            )}
            <CreateOptionsOverlay />
        </RenderParentProvider>
    );
});
