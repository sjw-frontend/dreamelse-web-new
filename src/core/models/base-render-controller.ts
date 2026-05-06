import type { Container } from 'inversify';

import { AppError } from '$/errors';
import { ListenerLikeCallbackSymbol } from '$/global-symbol';
import type { CoreTypes, RouterTypes } from '$/types';
import { TimerUtils } from '$/utils';

import { BaseController } from './base-controller';

const AutoClearDefaultSymbol = Symbol('AutoClearDefault');

const OnMountSymbol = Symbol('onMount');
const OnUnmountSymbol = Symbol('onUnmount');
const ContainerGetterSymbol = Symbol('containerGetter');
const RouteFocusedSymbol = Symbol('routeFocused');
const RouteSymbol = Symbol('route');

export abstract class BaseRenderController<
    TState extends CoreTypes.ModelState,
    TInternalState extends TState,
    TEventMap extends LibTypes.BaseEventMap = never,
    TProps extends CoreTypes.Props = never,
> extends BaseController<
    TState,
    TInternalState,
    TEventMap,
    TProps,
    CoreTypes.RenderPresetsState
> {
    public static readonly OnMountSymbol: typeof OnMountSymbol = OnMountSymbol;

    public static readonly OnUnmountSymbol: typeof OnUnmountSymbol =
        OnUnmountSymbol;

    public static readonly ContainerGetterSymbol: typeof ContainerGetterSymbol =
        ContainerGetterSymbol;

    public static readonly RouteFocusedSymbol: typeof RouteFocusedSymbol =
        RouteFocusedSymbol;

    public static readonly RouteSymbol: typeof RouteSymbol = RouteSymbol;

    public constructor() {
        super();

        this.#setRouteFocused(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (this.props as LibTypes.FrozenGeneralObj)[
                RouteFocusedSymbol
            ] as CoreTypes.RenderPresetsState['routeFocused'],
        );
        this.#setRoute(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (this.props as LibTypes.FrozenGeneralObj)[
                RouteSymbol
            ] as CoreTypes.RenderPresetsState['route'],
        );
    }

    #container?: Container;
    #onUnmount?: LibTypes.SimpleFunction;

    readonly #autoClearMap = new Map<
        string | symbol,
        LibTypes.Arr<LibTypes.ListenerLike>
    >();

    public get [ContainerGetterSymbol]() {
        if (!this.#container) {
            throw new AppError('找不到container,该实例是非法构造的！');
        }

        return this.#container;
    }

    public set [ContainerGetterSymbol](value) {
        this.#container = value;
    }

    #setRoute(route: CoreTypes.RenderPresetsState['route']) {
        (this.internal as CoreTypes.RenderPresetsState).route = route && {
            key: route.key,
            name: route.name,
            params: route.params,
        };
    }

    #setRouteFocused(
        routeFocused: CoreTypes.RenderPresetsState['routeFocused'],
    ) {
        (this.internal as CoreTypes.RenderPresetsState).routeFocused =
            routeFocused;
    }

    protected autoClear(
        key: string | symbol,
        ...args: LibTypes.Arr<LibTypes.ListenerLike>
    ) {
        const list = this.#autoClearMap.get(key);
        list?.forEach(
            item =>
                !args.find(
                    one =>
                        one[ListenerLikeCallbackSymbol] ===
                        item[ListenerLikeCallbackSymbol],
                ) && item(),
        );
        this.#autoClearMap.set(key, args);
    }

    /** 注意，每次调用都会清空上一次的watch或listener，一般用在setRelatedControllers中 */
    protected autoClearRelatedControllers(
        ...args: LibTypes.Arr<LibTypes.ListenerLike>
    ) {
        this.autoClear(AutoClearDefaultSymbol, ...args);
    }

    protected readyToDisplay() {
        (this.internal as CoreTypes.RenderPresetsState).readyToDisplay = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    protected onMount(): LibTypes.SimpleFunction | void {}

    protected override destroy() {
        super.destroy();
        this.#container?.unbindAll();
        this.#container = undefined;
    }

    public [OnMountSymbol]() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        this.#onUnmount = this.onMount() ?? undefined;
        TimerUtils.nextTick(() => {
            (this.internal as CoreTypes.RenderPresetsState).mounted = true;
        });
    }

    public [OnUnmountSymbol]() {
        (this.internal as CoreTypes.RenderPresetsState).mounted = false;
        (this.internal as CoreTypes.RenderPresetsState).unmounted = true;
        this.#onUnmount?.();
        TimerUtils.nextTick(() => {
            this.destroy();
        });
    }

    public [RouteFocusedSymbol](
        routeFocused: CoreTypes.RenderPresetsState['routeFocused'] & {},
    ) {
        this.#setRouteFocused(routeFocused);
    }

    public [RouteSymbol](route: RouterTypes.Route | null) {
        this.#setRoute(route);
    }
}
