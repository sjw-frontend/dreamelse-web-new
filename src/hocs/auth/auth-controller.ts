import { RouterController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';

type InternalState = LibTypes.VarDefine<{
    get loggedIn(): boolean,
    tryLogin: boolean,
}>;

type State = LibTypes.FrozenPick<InternalState, 'loggedIn'>;

@renderController()
export class AuthController extends BaseRenderController<State, InternalState> {
    public constructor(
        userController: UserController,
        routerController: RouterController,
    ) {
        super();
        this.#userController = userController;
        this.#routerController = routerController;
    }

    readonly #userController;
    readonly #routerController;

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            tryLogin: false,
            get loggedIn() {
                return !!$this.#userController.state.loggedInUser;
            },
        };
    }

    protected override onMount() {
        this.watch(
            () =>
                !this.internal.loggedIn && this.internal.routeFocused === true,
            value => {
                if (value) {
                    if (!this.internal.tryLogin) {
                        this.internal.tryLogin = true;
                        this.#routerController.toLogin();
                    } else {
                        this.#routerController.goBackOrHome();
                    }
                }
            },
            { immediate: true },
        );
    }
}
