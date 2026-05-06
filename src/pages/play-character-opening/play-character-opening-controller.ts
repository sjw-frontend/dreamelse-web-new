// @ts-nocheck
import type { DramatizeEngineController } from '$/component-controllers';
import { CharacterController, RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { AppError } from '$/errors';
import { ApiService } from '$/services';
import type { CharacterTypes } from '$/types';

import { getCharacterInfoFromRoute } from '../@com';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo | null,

    showLoading: boolean,
    showLottie: boolean,
}>;

type State = LibTypes.FrozenPick<InternalState, 'showLoading' | 'showLottie'>;

type Context = LibTypes.VarDefine<{
    openingId: string | null,
    nextCursor: string | null,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    dramatizeEngineCtrl: DramatizeEngineController,
}>;

@renderController()
export class PlayCharacterOpeningController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        apiService: ApiService,
        routerController: RouterController,
        characterController: CharacterController,
    ) {
        super();
        this.#apiService = apiService;
        this.#routerController = routerController;
        this.#characterController = characterController;

        this.#init();
    }

    readonly #apiService;
    readonly #routerController;
    readonly #characterController;

    #relatedControllers?: RelatedControllers;

    readonly #ctx: Context = {
        openingId: null,
        nextCursor: null,
    };

    #init() {
        this.internal.data = getCharacterInfoFromRoute(
            this.internal.route,
            this.#characterController,
        );

        this.#ctx.openingId =
            this.internal.route?.params?.ids?.[1]?.toString() ?? null;
    }

    #start() {
        this.#relatedControllers?.dramatizeEngineCtrl.startPlay({
            requestNarrativesCallback: async () => {
                if (this.#ctx.openingId != null && this.internal.data) {
                    const res =
                        await this.#apiService.call.character.get_character_opening_log(
                            {
                                character_id: this.internal.data.id,
                                opening_log_id: this.#ctx.openingId,
                            },
                            {
                                isLongTask: true,
                            },
                        );

                    this.#ctx.nextCursor = res.next_cursor;

                    return {
                        narratives: res.narratives,
                        resource: res.resource,
                        hasMore: res.has_more,
                    };
                }

                throw new AppError('PlayCharacterOpeningController 非法参数');
            },
        });
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: null,
            showLoading: true,
            showLottie: true,
        };
    }

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        this.#relatedControllers = relatedControllers;
        const { dramatizeEngineCtrl } = relatedControllers;

        this.autoClearRelatedControllers(
            this.watch(
                () => dramatizeEngineCtrl.state.isWorldLineEnd,
                isWorldLineEnd => {
                    if (isWorldLineEnd) {
                        this.toDetails();
                    }
                },
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.isLoading,
                isLoading => {
                    this.internal.showLoading = isLoading;
                },
                {
                    immediate: true,
                },
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.isWaitFirst,
                isWaitFirst => {
                    this.internal.showLottie = isWaitFirst;
                },
                {
                    immediate: true,
                },
            ),
        );

        this.#start();
    };

    public readonly toDetails = () => {
        this.internal.data &&
            this.#routerController.replace(
                RouterEnums.RouteName.CharacterList,
                {
                    ids: [this.internal.data.id],
                },
            );
    };
}
