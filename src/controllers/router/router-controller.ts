// @ts-nocheck
import {
    CommonActions,
    type NavigationAction,
    StackActions,
} from '@react-navigation/native';

import { ROUTER } from '$/consts';
import {
    BaseRenderController,
    BaseZoneController,
    zoneController,
} from '$/core';
import { RouterEnums } from '$/enums';
import { RouterService } from '$/services';
import type { CoreTypes, RouterTypes } from '$/types';

type Preload = LibTypes.VarDefine<{
    routeKey: string,
    ctrl: LibTypes.Nullable<CoreTypes.RenderController>,
    get route(): RouterTypes.Route,
}>;

type InternalState = LibTypes.VarDefine<{
    currentState: RouterTypes.PartialableRouteState | null,
    ready: boolean,

    get currentRoute(): RouterTypes.PartialableRoute | null,
}>;

type State = LibTypes.FrozenPick<InternalState, 'currentRoute' | 'ready'>;

type Context = LibTypes.VarDefine<{
    preloads: LibTypes.Arr<Preload>,
}>;

@zoneController()
export class RouterController extends BaseZoneController<State, InternalState> {
    public constructor(routerService: RouterService) {
        super();
        this.#routerService = routerService;

        this.#watch();
    }

    readonly #routerService;

    #preloadIndex = 0;
    readonly #preloadCtrlMap: LibTypes.VarGeneralObj<CoreTypes.RenderController | null> =
        {};

    readonly #ctx: Context = {
        preloads: [],
    };

    #watch() {
        this.#routerService.addListener('state', evt => {
            this.internal.currentState =
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                (evt.data.state as RouterTypes.PartialableRouteState | null) ??
                null;

            this.#setPreloads(
                this.internal.currentState?.preloadedRoutes ?? [],
            );
        });

        this.#routerService.addListener('ready', () => {
            this.internal.ready = true;
        });
    }

    #callAction(action: NavigationAction) {
        this.#routerService.callAction(action);
    }

    #setPreloads(routes: LibTypes.Arr<RouterTypes.Route>) {
        const list: LibTypes.VarArr<Preload> = [];

        routes.forEach(route => {
            const item = this.#ctx.preloads.find(
                one => one.routeKey === route.key,
            );
            if (item) {
                list.push(item);
            } else {
                const preloadId = route.params?.preloadId;
                list.push({
                    routeKey: route.key,
                    ctrl:
                        preloadId != null
                            ? this.#preloadCtrlMap[preloadId]
                            : null,
                    get route() {
                        return route;
                    },
                });
                preloadId != null && (this.#preloadCtrlMap[preloadId] = null);
            }
        });
        this.#ctx.preloads = list;
    }

    async #preload<T extends RouterTypes.RouteName>(
        routeName: T,
        params: RouterTypes.RouteParams = {},
        ...args: T extends keyof typeof ROUTER.PreloadPageInstanceGetters
            ? CoreTypes.InferCreateInstanceArgs<
                  Awaited<
                      ReturnType<(typeof ROUTER.PreloadPageInstanceGetters)[T]>
                  >
              >
            : []
    ) {
        type Getters = typeof ROUTER.PreloadPageInstanceGetters;
        type Res = T extends keyof Getters
            ? InstanceType<Awaited<ReturnType<Getters[T]>>>
            : null;

        let ctrl = null;
        const zone = this[RouterController.ZoneGetterSymbol];
        if (routeName in ROUTER.PreloadPageInstanceGetters) {
            const getter =
                ROUTER.PreloadPageInstanceGetters[
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    routeName as keyof Getters
                ];
            (args as LibTypes.VarArr)[0] = {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                ...((args as LibTypes.VarArr)[0] as LibTypes.Reference),
                [BaseRenderController.RouteSymbol]: {
                    name: routeName,
                    params,
                },
            };
            ctrl =
                zone.getOrCreateHeadRenderController<CoreTypes.RenderControllerClass>(
                    null,
                    await getter(),
                    ...args,
                );
        }

        const preloadId = this.#preloadIndex++;
        ctrl && (this.#preloadCtrlMap[preloadId] = ctrl);
        const p: RouterTypes.RouteParams = {
            preload: true,
            preloadId,
            ...params,
        };

        this.#callAction(CommonActions.preload(routeName, p));

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return ctrl as Res;
    }

    #canBackTo(routeName: RouterEnums.RouteName) {
        return this.internal.currentState?.routes.at(-2)?.name === routeName;
    }

    #getRouteFromState(
        routeName: RouterEnums.RouteName,
        newParams?: RouterTypes.RouteParams,
    ): LibTypes.Nullable<RouterTypes.PartialableRoute> {
        const currentState = this.internal.currentState;

        if (currentState) {
            const currentRoutes = [
                ...(currentState.preloadedRoutes ?? []),
                ...currentState.routes,
            ];

            const route = currentRoutes.find(item => item.name === routeName);

            return (
                route && {
                    ...route,
                    params: {
                        ...route.params,
                        ...newParams,
                    },
                }
            );
        }
        return null;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            currentState: null,
            ready: false,
            get currentRoute() {
                return this.currentState?.index == null
                    ? null
                    : (this.currentState.routes[this.currentState.index] ??
                          null);
            },
        };
    }

    public readonly preload = async <T extends RouterTypes.RouteName>(
        routeName: T,
        params: RouterTypes.RouteParams = {},
        ...args: T extends keyof typeof ROUTER.PreloadPageInstanceGetters
            ? CoreTypes.InferCreateInstanceArgs<
                  Awaited<
                      ReturnType<(typeof ROUTER.PreloadPageInstanceGetters)[T]>
                  >
              >
            : []
    ) => this.#preload(routeName, params, ...args);

    public readonly preloadIfNeed = async (
        routeName: RouterTypes.RouteName,
        params: RouterTypes.RouteParams = {},
    ) => {
        if (!this.#ctx.preloads.some(item => item.route.name === routeName)) {
            return this.#preload(routeName, params);
        }

        return null;
    };

    public readonly navigate = (
        routeName: RouterTypes.RouteName,
        params: RouterTypes.RouteParams = {},
        options?: LibTypes.FrozenDefine<{
            merge?: boolean,
            pop?: boolean,
        }>,
    ) => {
        this.#callAction(CommonActions.navigate(routeName, params, options));
    };

    public readonly reset = (state: RouterTypes.PartialableRouteState) => {
        this.#callAction(CommonActions.reset(state));
    };

    public readonly resetTo = (
        routeName: RouterTypes.RouteName,
        params?: RouterTypes.RouteParams,
        forceRemount?: boolean,
    ) => {
        const route = this.#getRouteFromState(routeName, params);

        if (!forceRemount && route) {
            this.reset({
                index: 0,
                routes: [route],
            });
        } else {
            this.reset({
                index: 0,
                routes: [
                    {
                        name: routeName,
                        params,
                    },
                ],
            });
        }
    };

    public readonly goBack = () => {
        this.#callAction(CommonActions.goBack());
    };

    public readonly push = (
        routeName: RouterTypes.RouteName,
        params: RouterTypes.RouteParams = {},
    ) => {
        this.#callAction(StackActions.push(routeName, params));
    };

    public readonly replace = (
        routeName: RouterTypes.RouteName,
        params: RouterTypes.RouteParams = {},
    ) => {
        this.#callAction(StackActions.replace(routeName, params));
    };

    public readonly popTo = (
        routeName: RouterTypes.RouteName,
        params: RouterTypes.RouteParams = {},
    ) => {
        this.#callAction(StackActions.popTo(routeName, params));
    };

    public readonly pop = (count?: number) => {
        this.#callAction(StackActions.pop(count));
    };

    public readonly popToTop = () => {
        this.#callAction(StackActions.popToTop());
    };

    public readonly resetToHome = (
        params?: RouterTypes.RouteParams,
        forceRemount?: boolean,
    ) => {
        this.resetTo(RouterEnums.RouteName.Home, params, forceRemount);
    };

    public readonly goBackOrHome = () => {
        if (this.#routerService.canGoBack()) {
            this.goBack();
        } else {
            this.resetToHome();
        }
    };

    public readonly toLogin = () => {
        this.navigate(RouterEnums.RouteName.Login);
    };

    // TODO 待解决bug
    public readonly backToOrReplace = (
        routeName: RouterTypes.RouteName,
        params: RouterTypes.RouteParams = {},
    ) => {
        if (this.#canBackTo(routeName)) {
            this.goBackOrHome();
        } else {
            this.replace(routeName, params);
        }
    };

    // TODO 待解决bug
    public readonly goTo = (
        routeName: RouterTypes.RouteName,
        params: RouterTypes.RouteParams = {},
    ) => {
        const route = this.#getRouteFromState(routeName, params);
        if (!route) {
            this.push(routeName, params);

            return;
        }

        const routes: LibTypes.VarArr<RouterTypes.PartialableRoute> =
            this.internal.currentState?.routes.filter(
                item => item.key !== route.key,
            ) ?? [];
        routes.push(route);

        const state = {
            // ...this.internal.currentState,
            index: routes.length - 1,
            routes,
        };

        this.reset(state);
    };
}
