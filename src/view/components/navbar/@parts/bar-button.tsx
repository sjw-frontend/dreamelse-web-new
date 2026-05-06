import { useMemo } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useInjectRenderController } from '$/hooks';
import { Pressable } from '$/uis/primitives';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { NavbarController } from '../navbar-controller';
import type { RouterEnums } from '$/enums';

interface BarButtonProps {
    routeName: RouterEnums.RouteName;
    icon: React.ReactNode;
    focusIcon?: React.ReactNode;
    onPress: () => void;
    large?: boolean;
}

export const BarButton = optimize(({ routeName, icon, focusIcon, onPress, large }: BarButtonProps) => {
    const ctrl = useInjectRenderController(NavbarController);
    const routerState = useRouterState();
    const pathname = routerState.location.pathname;

    const focused = useMemo(() => {
        const segments = pathname.split('/').filter(Boolean);
        const last = segments.at(-1) ?? '';
        return last === routeName || pathname === `/${routeName}`;
    }, [pathname, routeName]);

    return (
        <Pressable
            onPress={onPress}
            className={cn('flex-1 flex flex-col items-center justify-center', large && 'scale-110')}
        >
            {focused && focusIcon ? focusIcon : icon}
        </Pressable>
    );
});
