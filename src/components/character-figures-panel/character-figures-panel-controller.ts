import { CharacterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { CharacterTypes } from '$/types';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo,
    controlWritable: boolean,
    expanded: boolean,
    loadingMap: LibTypes.VarGeneralObj<boolean>,
    get writable(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    'data' | 'expanded' | 'loadingMap' | 'writable'
>;

type EventMap = LibTypes.FrozenDefine<{
    onEdit: LibTypes.Func<void, [figure: CharacterTypes.Figure]>,
}>;

type Props = LibTypes.FrozenDefine<{
    data: CharacterTypes.FrozenCharacterInfo,
    writable: boolean,
}>;

@renderController()
export class CharacterFiguresPanelController extends BaseRenderController<
    State,
    InternalState,
    EventMap,
    Props
> {
    public constructor(characterController: CharacterController) {
        super();
        this.#characterController = characterController;
    }

    readonly #characterController;

    protected override getInitialInternalState(): InternalState {
        return {
            data: this.props.data,
            expanded: false,
            controlWritable: this.props.writable,
            loadingMap: {},
            get writable() {
                return this.controlWritable && this.expanded;
            },
        };
    }

    public readonly setData = (data: CharacterTypes.FrozenCharacterInfo) => {
        this.internal.data = data;
    };

    public readonly toggleExpanded = () => {
        this.internal.expanded = !this.internal.expanded;
    };

    public readonly selectFigure = (figureId: string) => {
        this.#characterController.setCharacterState(
            this.internal.data.id,
            'currentViewFigureId',
            figureId,
        );
    };

    public readonly editFigure = (figure: CharacterTypes.Figure) => {
        this.emitEvent('onEdit', figure);
    };
}
