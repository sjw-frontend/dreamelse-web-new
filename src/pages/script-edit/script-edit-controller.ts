// @ts-nocheck
import type { ScriptEditorController } from '$/component-controllers';
import { RouterController, ScriptController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import type { ScriptTypes } from '$/types';

import { getScriptInfoFromRoute } from '../@com';

type InternalState = LibTypes.VarDefine<{
    data: ScriptTypes.FrozenDraftInfo | null,
    needSave: boolean,
}>;

type State = LibTypes.FrozenPick<InternalState, 'data' | 'needSave'>;

type EventMap = LibTypes.FrozenDefine<{
    noData: LibTypes.SimpleFunction,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    scriptEditorCtrl: ScriptEditorController,
}>;

@renderController()
export class ScriptEditController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        scriptController: ScriptController,
        routerController: RouterController,
    ) {
        super();
        this.#scriptController = scriptController;
        this.#routerController = routerController;

        this.#init();
    }

    readonly #scriptController;
    readonly #routerController;

    #relatedControllers?: RelatedControllers;

    #init() {
        this.internal.data =
            getScriptInfoFromRoute(this.internal.route, this.#scriptController)
                ?.draftInfo ?? null;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: null,
            needSave: false,
        };
    }

    // 导航相关
    public readonly goBack = async () => {
        if (this.#relatedControllers?.scriptEditorCtrl.state.needSave) {
            await this.#relatedControllers.scriptEditorCtrl.handleUpdate();
            this.#routerController.backToOrReplace(
                RouterEnums.RouteName.ScriptDraft,
            );
        } else {
            this.#routerController.goBack();
        }
};

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        this.#relatedControllers = relatedControllers;
        const { scriptEditorCtrl } = relatedControllers;

        this.autoClearRelatedControllers(
            scriptEditorCtrl.addEventListener('submit', () => {
                this.#routerController.goBack();
            }),
            this.watch(
                () => scriptEditorCtrl.state.needSave,
                needSave => {
                    this.internal.needSave = needSave;
                },
                {
                    immediate: true,
                },
            ),
        );
    };
}
