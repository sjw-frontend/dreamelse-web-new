import { RouterController, ScriptController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums, ScriptEnums } from '$/enums';
import type { ScriptTypes } from '$/types';
import { ArrayUtils } from '$/utils';

type InternalState = LibTypes.VarDefine<{
    ids: LibTypes.Arr<ScriptTypes.ScriptId>,
    nextCursor: string | null,
    hasMore: boolean,
}>;
type State = LibTypes.FrozenPick<InternalState, 'ids'>;

@renderController()
export class ScriptDraftController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        routerController: RouterController,
        scriptController: ScriptController,
    ) {
        super();
        this.#routerController = routerController;
        this.#scriptController = scriptController;

        this.#init();
    }

    readonly #routerController;
    readonly #scriptController;

    #init() {
        this.requestList();
    }

    protected override getInitialInternalState(): InternalState {
        return {
            ids: [],
            nextCursor: null,
            hasMore: true,
        };
    }

    public readonly goBack = () => {
        this.#routerController.backToOrReplace(RouterEnums.RouteName.Me);
    };

    public readonly requestList = async () => {
        if (this.internal.hasMore) {
            const res = await this.#scriptController.requestMyDraftList(
                this.internal.nextCursor,
            );
            this.internal.ids = ArrayUtils.toDeduplicate([
                ...this.internal.ids,
                ...res.ids,
            ]);
            this.internal.hasMore = res.hasMore;
            this.internal.nextCursor = res.nextCursor;
        }
    };

    public readonly onPressScript = async (
        info: ScriptTypes.FrozenScriptInfo,
    ) => {
        if (
            info.draftInfo?.state.status === ScriptEnums.Status.Published ||
            info.draftInfo?.state.status === ScriptEnums.Status.Publishing ||
            info.draftInfo?.version == null
        ) {
            return;
        }

        await this.#scriptController.requestDraftDetails(
            info.id,
            info.draftInfo.version,
        );

        this.#routerController.navigate(RouterEnums.RouteName.ScriptEdit, {
            ids: [info.id],
        });
    };
}
