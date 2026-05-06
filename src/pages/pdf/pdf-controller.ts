import { RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';

type InternalState = LibTypes.FrozenGeneralObj;

type State = LibTypes.FrozenGeneralObj;

@renderController()
export class PDFController extends BaseRenderController<State, InternalState> {
    public constructor(routerController: RouterController) {
        super();
        this.#routerController = routerController;
    }

    readonly #routerController;

    protected override getInitialInternalState(): InternalState {
        return {};
    }

    public readonly back = () => this.#routerController.goBackOrHome();
}
