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

        // Convert RN-style { ids: [...], value: ... } params to TanStack Router params
        // ids array is passed as search param so controllers can read it via route.params.ids
        const buildNavParams = (routeName: string, rawParams: Record<string, unknown> = {}) => {
            const path = routeNameToPath[routeName as RouterEnums.RouteName];
            if (!path) return null;

            // Extract path param names from path template (e.g. $playId, $scriptId)
            const pathParamNames = (path.match(/\$[^/]+/g) ?? []).map(p => p.slice(1));

            // ids array: map positionally to path params
            const ids: unknown[] = Array.isArray(rawParams.ids) ? rawParams.ids : [];
            const pathParams: Record<string, string> = {};
            pathParamNames.forEach((name, i) => {
                const val = ids[i] ?? rawParams[name];
                if (val != null) pathParams[name] = String(val);
            });

            // Pass ids + value as search params so controllers can read them
            const search: Record<string, string> = {};
            if (ids.length > 0) search.ids = JSON.stringify(ids);
            if (rawParams.value != null) search.value = String(rawParams.value);

            return { path, pathParams, search };
        };

        switch (action.type) {
            case 'NAVIGATE': {
                const nav = buildNavParams(action.payload?.name ?? '', action.payload?.params as Record<string, unknown>);
                if (nav) {
                    console.log('[Router] NAVIGATE', action.payload?.name, nav);
                    void _router.navigate({ to: nav.path, params: nav.pathParams, search: nav.search });
                }
                break;
            }
            case 'REPLACE': {
                const nav = buildNavParams(action.payload?.name ?? '', action.payload?.params as Record<string, unknown>);
                if (nav) {
                    console.log('[Router] REPLACE', action.payload?.name, nav);
                    void _router.navigate({ to: nav.path, params: nav.pathParams, search: nav.search, replace: true });
                }
                break;
            }
            case 'RESET': {
                const routes = action.payload?.routes;
                const firstRoute = Array.isArray(routes) ? routes[0] : null;
                if (firstRoute) {
                    const nav = buildNavParams(firstRoute.name, firstRoute.params as Record<string, unknown>);
                    if (nav) void _router.navigate({ to: nav.path, params: nav.pathParams, search: nav.search, replace: true });
                }
                break;
            }
            case 'GO_BACK':
                _router.history.back();
                break;
            case 'PRELOAD':
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
