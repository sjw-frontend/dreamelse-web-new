// @ts-nocheck
import { CharacterController, RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { CharacterTypes } from '$/types';

import { getCharacterInfoFromRoute } from '../@com';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo | null,
}>;

type State = LibTypes.FrozenPick<InternalState, 'data'>;

@renderController()
export class CharacterStatsController extends BaseRenderController<
    State,
    InternalState
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
        this.internal.data = getCharacterInfoFromRoute(
            this.internal.route,
            this.#characterController,
        );
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: null,
        };
    }

    // 导航相关
    public readonly goBack = () => {
        this.#routerController.goBack();
    };
}
