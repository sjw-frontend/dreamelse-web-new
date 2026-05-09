import {
    AppController,
    CharacterController,
    RouterController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import type { CharacterTypes } from '$/types';

type InternalState = LibTypes.VarDefine<{
    readonly id: CharacterTypes.CharacterId,
    get data(): LibTypes.Nullable<CharacterTypes.FrozenCharacterInfo>,
    showLongPressMenu: boolean,
}>;

type State = LibTypes.FrozenPick<InternalState, 'data' | 'showLongPressMenu'>;

type Props = LibTypes.FrozenDefine<{
    id: CharacterTypes.CharacterId,
}>;

@renderController()
export class CharacterMomentCardController extends BaseRenderController<
    State,
    InternalState,
    never,
    Props
> {
    public constructor(
        characterController: CharacterController,
        routerController: RouterController,
        appController: AppController,
    ) {
        super();
        this.#characterController = characterController;
        this.#routerController = routerController;
        this.#appController = appController;
    }

    readonly #characterController;
    readonly #routerController;
    readonly #appController;

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            id: this.props.id,
            get data() {
                return $this.#characterController.getCharacter(this.id);
            },
            showLongPressMenu: false,
        };
    }

    public readonly openLongPressMenu = () => {
        this.internal.showLongPressMenu = true;
    };

    public readonly closeLongPressMenu = () => {
        this.internal.showLongPressMenu = false;
    };

    public readonly handleDislike = async () => {
        this.closeLongPressMenu();
        await this.#appController.waitMoment(async () => {
            await this.#characterController.requestDelete(this.internal.id);
        });
    };

    public readonly toInteraction = () => {
        this.#characterController.requestCharacterInfo(this.internal.id);
        this.#routerController.navigate(
            RouterEnums.RouteName.CharacterInteraction,
            { ids: [this.internal.id] },
        );
    };
}
