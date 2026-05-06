// web版：替换 React Navigation → TanStack Router
import { BaseService, service } from '$/core';
import { RouterEnums } from '$/enums';
import type { RouterTypes } from '$/types';
import { routeNameToPath, pathToRouteName } from './router-name-map';

type NavigationAction = {
    type: 'NAVIGATE' | 'GO_BACK' | 'RESET' | 'REPLACE' | 'PRELOAD' | 'SET_PARAMS' | string;
    payload?: {
        name?: string;
        params?: RouterTypes.RouteParams;
        routes?: Array<{ name: string; params?: RouterTypes.RouteParams }>;
        [key: string]: unknown;
    };
};

// router 实例由 src/app/routes/router.ts 提供，延迟引入避免循环依赖
let _router: import('@tanstack/react-router').Router<any, any> | null = null;

export const setRouterInstance = (r: import('@tanstack/react-router').Router<any, any>) => {
    _router = r;
};

// Convert TanStack Router state to React Navigation-compatible state
const getNavState = () => {
    if (!_router) return null;
    const { location, matches } = _router.state;
    const name = pathToRouteName(location.pathname);
    if (!name) return null;
    const currentMatch = matches.at(-1);
    const route = {
        name,
        key: currentMatch?.id ?? name,
        params: (currentMatch?.params ?? {}) as RouterTypes.RouteParams,
    };
    return {
        routes: [route],
        index: 0,
        key: route.key,
        type: 'stack',
        stale: false,
    };
};

@service()
export class RouterService extends BaseService {
    public readonly addListener = (
        event: string,
        callback: (e: unknown) => void,
    ) => {
        if (!_router) return () => {};
        return _router.subscribe('onResolved', () => {
            if (event === 'state') {
                const navState = getNavState();
                if (navState) {
                    callback({ data: { state: navState } });
                }
            }
        });
    };

    public readonly removeListener = (_event: string, _callback: unknown) => {};

    public readonly callAction = (action: NavigationAction) => {
        if (!action || !_router) return;
        switch (action.type) {
            case 'NAVIGATE': {
                const path = routeNameToPath[action.payload?.name as RouterEnums.RouteName];
                if (path) void _router.navigate({ to: path, params: action.payload?.params as Record<string, string> });
                break;
            }
            case 'REPLACE': {
                const path = routeNameToPath[action.payload?.name as RouterEnums.RouteName];
                if (path) void _router.navigate({ to: path, params: action.payload?.params as Record<string, string>, replace: true });
                break;
            }
            case 'RESET': {
                const routes = action.payload?.routes;
                const firstRoute = Array.isArray(routes) ? routes[0] : null;
                if (firstRoute) {
                    const path = routeNameToPath[firstRoute.name as RouterEnums.RouteName];
                    if (path) void _router.navigate({ to: path, params: firstRoute.params as Record<string, string>, replace: true });
                }
                break;
            }
            case 'GO_BACK':
                _router.history.back();
                break;
            case 'PRELOAD':
                // TanStack Router handles preloading automatically
                break;
            default:
                break;
        }
    };

    public readonly canGoBack = () => _router?.history.canGoBack() ?? false;

    public getCurrentRoute(): RouterTypes.Route | null {
        if (!_router) return null;
        const { location, matches } = _router.state;
        const currentMatch = matches.at(-1);
        if (!currentMatch) return null;
        const name = pathToRouteName(location.pathname);
        if (!name) return null;
        return {
            name,
            key: currentMatch.id,
            params: currentMatch.params as RouterTypes.RouteParams,
        };
    }
}
