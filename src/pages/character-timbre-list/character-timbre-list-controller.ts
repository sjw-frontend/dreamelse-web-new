// @ts-nocheck
import { CharacterController, RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { CharacterTypes } from '$/types';

import { getMaySetupCharacterInfoFromRoute } from '../@com';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo | null,
    submitToRemote: boolean,
}>;

type State = LibTypes.FrozenPick<InternalState, 'data'>;

type EventMap = LibTypes.FrozenDefine<{
    onChange: LibTypes.Func<void, [timbre: CharacterTypes.Timbre]>,
}>;

@renderController()
export class CharacterTimbreListController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        characterController: CharacterController,
        routerController: RouterController,
    ) {
        super();
        this.#characterController = characterController;
        this.#routerController = routerController;

        this.#init();
    }

    readonly #characterController;
    readonly #routerController;

    #init() {
        this.internal.data = getMaySetupCharacterInfoFromRoute(
            this.internal.route,
            this.#characterController,
        );

        this.internal.submitToRemote =
            this.internal.route?.params?.value === true;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: null,
            submitToRemote: false,
        };
    }

    // 返回
    public readonly handleBack = () => {
        this.#routerController.goBack();
    };

    // 切换音色
    public readonly selectTimbre = (timbre: CharacterTypes.Timbre) => {
        this.internal.data &&
            this.#characterController.setCharacterState(
                this.internal.data.id,
                'currentTimbreId',
                timbre.id,
                this.internal.submitToRemote,
            );
    };
}
