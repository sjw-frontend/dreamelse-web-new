import { CharacterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { CharacterTypes } from '$/types';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo,
}>;

type State = LibTypes.FrozenPick<InternalState, 'data'>;

type Props = LibTypes.FrozenDefine<{
    data: CharacterTypes.FrozenCharacterInfo,
    submitToRemote: boolean,
}>;

type Context = LibTypes.VarDefine<{
    submitToRemote: boolean,
}>;

@renderController()
export class CharacterDescController extends BaseRenderController<
    State,
    InternalState,
    never,
    Props
> {
    public constructor(characterController: CharacterController) {
        super();
        this.#characterController = characterController;
        this.#init();
    }

    readonly #characterController;

    readonly #ctx: Context = {
        submitToRemote: false,
    };

    #init() {
        this.#ctx.submitToRemote = this.props.submitToRemote;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: this.props.data,
        };
    }

    public readonly setData = (data: CharacterTypes.FrozenCharacterInfo) => {
        this.internal.data = data;
    };

    public readonly updateDesc = (desc: string) => {
        this.#characterController.setCharacterState(
            this.internal.data.id,
            'desc',
            desc,
            this.#ctx.submitToRemote,
        );
    };

    public readonly submitToRemote = (submitToRemote: boolean) =>
        (this.#ctx.submitToRemote = submitToRemote);
}
