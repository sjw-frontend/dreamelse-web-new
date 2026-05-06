import { RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';

type InternalState = LibTypes.VarDefine<{
    ready: true,
}>;
type State = LibTypes.FrozenPick<InternalState, 'ready'>;

@renderController()
export class AboutController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(routerController: RouterController) {
        super();
        this.#routerController = routerController;
    }

    readonly #routerController;

    protected override getInitialInternalState(): InternalState {
        return {
            ready: true,
        };
    }

    public readonly back = () => this.#routerController.goBackOrHome();
}
