import {
    CharacterController,
    RouterController,
    UserController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';

type InternalState = LibTypes.VarDefine<{
    nextCursor: string | null,
    hasMore: boolean,
    currentShowDeleteMenuId: string | null,
}>;

type State = LibTypes.FrozenPick<InternalState, 'currentShowDeleteMenuId'>;

type EventMap = LibTypes.FrozenDefine<{
    refresh: LibTypes.Func<void, [dataChange: boolean]>,
}>;

@renderController()
export class CharacterListController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        characterController: CharacterController,
        routerController: RouterController,
        userController: UserController,
    ) {
        super();
        this.#routerController = routerController;
        this.#userController = userController;
        this.#characterController = characterController;

        this.#watch();
    }

    readonly #routerController;
    readonly #userController;
    readonly #characterController;

    #watch() {
        this.watch(
            () =>
                this.#userController.state.loggedInUser?.characterDetails.state
                    .list[0],
            (_, prevValue) => {
                if (prevValue != null) {
                    this.emitEvent('refresh', true);
                }
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () => this.internal.routeFocused === true,
            value => {
                if (value) {
                    this.#characterController.requestMyList();
                }
            },
            {
                immediate: true,
            },
        );
    }

    protected override getInitialInternalState(): InternalState {
        return {
            nextCursor: null,
            hasMore: true,
            currentShowDeleteMenuId: null,
        };
    }

    public readonly toUserSettings = () => {
        // this.#routerController.navigate(RouterEnums.RouteName.UserSettings);
    };

    public readonly goCreate = () => {
        this.#routerController.navigate(RouterEnums.RouteName.CharacterCreate);
    };

    public readonly goInteraction = (id: string) => {
        this.#routerController.navigate(RouterEnums.RouteName.CharacterInteraction, { characterId: id });
    };

    public readonly setCurrentShowDeleteMenuId = (id: string) => {
        this.internal.currentShowDeleteMenuId = id;
    };

    public readonly clearCurrentShowDeleteMenuId = (id: string) => {
        if (id === this.internal.currentShowDeleteMenuId) {
            this.internal.currentShowDeleteMenuId = null;
        }
    };
}
