import { APP } from '$/consts';
import { AppController, RouterController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { RouterTypes } from '$/types';

import { Settings } from './splash-const';

type InternalState = LibTypes.VarDefine<{
    finish: boolean,
    force: boolean,
}>;

type State = LibTypes.FrozenGeneralObj;

@renderController()
export class SplashController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        appController: AppController,
        routerController: RouterController,
        userController: UserController,
    ) {
        super();
        this.#appController = appController;
        this.#routerController = routerController;
        this.#userController = userController;
        this.#init();
    }

    readonly #appController;
    readonly #routerController;
    readonly #userController;

    async #init() {
        await this.#userController.loginByCache();
        this.#appController.preloadFirstRoute();

        this.watch(
            () =>
                this.#appController.state.enabled &&
                ((this.internal.finish &&
                    (this.#appController.state.firstRoute?.ctrl == null ||
                        this.#appController.state.firstRoute.ctrl.state
                            .readyToDisplay === true)) ||
                    this.internal.force),
            (value, _, unwatch) => {
                if (value) {
                    const firstRoute = this.#appController.state.firstRoute;
                    const params: RouterTypes.RouteParams = {
                        options: {
                            animation: APP.FirstRoute.animation,
                            animationTypeForReplace:
                                APP.FirstRoute.animationTypeForReplace,
                            animationDuration: APP.FirstRoute.animationDuration,
                        },
                    };
                    if (firstRoute) {
                        this.#routerController.resetTo(firstRoute.name, {
                            ...params,
                            ...firstRoute.params,
                        });
                    } else {
                        this.#routerController.resetToHome(params);
                    }
                    unwatch();
                }
            },
            {
                immediate: true,
            },
        );
    }

    protected override getInitialInternalState(): InternalState {
        return {
            finish: false,
            force: false,
        };
    }

    protected override onMount() {
        setTimeout(
            () => (this.internal.finish = true),
            Settings.minShowDurationMS,
        );
        setTimeout(
            () => (this.internal.force = true),
            Settings.maxShowDurationMS,
        );
    }
}
