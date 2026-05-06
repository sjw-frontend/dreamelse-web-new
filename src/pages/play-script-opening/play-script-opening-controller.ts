// @ts-nocheck
import type { DramatizeEngineController } from '$/component-controllers';
import { RouterController, ScriptController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { AppError } from '$/errors';
import { ApiService, FileService } from '$/services';
import type { ApiTypes } from '$/types';
import { FileUtils, MathUtils } from '$/utils';

type InternalState = LibTypes.VarDefine<{
    title: string | null,
    showLoading: boolean,
    showLottie: boolean,
    speed: number,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    'showLoading' | 'showLottie' | 'speed' | 'title'
>;

type Context = LibTypes.VarDefine<{
    scriptId: string | null,
    openingId: string | null,
    nextCursor: string | null,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    dramatizeEngineCtrl: DramatizeEngineController,
}>;

@renderController()
export class PlayScriptOpeningController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        apiService: ApiService,
        routerController: RouterController,
        scriptController: ScriptController,
        fileService: FileService,
    ) {
        super();
        this.#apiService = apiService;
        this.#fileService = fileService;
        this.#routerController = routerController;
        this.#scriptController = scriptController;

        this.#init();
    }

    readonly #apiService;
    readonly #fileService;
    readonly #routerController;
    readonly #scriptController;

    #relatedControllers?: RelatedControllers;

    readonly #ctx: Context = {
        scriptId: null,
        openingId: null,
        nextCursor: null,
    };

    #init() {
        const [scriptId, openingId] = this.internal.route?.params?.ids ?? [];

        this.#ctx.scriptId = scriptId?.toString() ?? null;
        this.#ctx.openingId = openingId?.toString() ?? null;

        if (this.#ctx.scriptId != null) {
            const scriptInfo = this.#scriptController.getScript(
                this.#ctx.scriptId,
            );

            this.internal.title = scriptInfo?.state.title ?? null;
        }
    }

    #start() {
        let bg: ApiTypes.Protocol.Media | null = null;
        this.#relatedControllers?.dramatizeEngineCtrl.startPlay({
            requestNarrativesCallback: async () => {
                if (this.#ctx.openingId != null) {
                    const res =
                        await this.#apiService.call.play.query_script_opening(
                            {
                                script_opening_id: this.#ctx.openingId,
                                next_cursor: this.#ctx.nextCursor ?? undefined,
                            },
                            {
                                isLongTask: true,
                            },
                        );

                    this.#ctx.nextCursor = res.next_cursor;

                    if (bg == null && this.#ctx.scriptId != null) {
                        bg = res.resource.background[0]?.images?.[0] ?? null;
                        bg &&
                            this.#scriptController.setScriptState(
                                this.#ctx.scriptId,
                                'preparePlayBackgroundImage',
                                this.#fileService.createImageResource(
                                    bg.id,
                                    FileUtils.getImageInfoFromApiInfo(bg),
                                ),
                            );
                    }

                    return {
                        narratives: res.narratives,
                        resource: res.resource,
                        hasMore: res.has_more,
                    };
                }

                throw new AppError('PlayScriptOpeningController 非法参数');
            },
        });
    }

    protected override getInitialInternalState(): InternalState {
        return {
            title: null,
            showLoading: true,
            showLottie: true,
            speed: 1,
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
                        this.toScriptPreparePlay();
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
            this.watch(
                () => dramatizeEngineCtrl.state.speed,
                speed => (this.internal.speed = speed),
            ),
        );

        this.#start();
    };

    public readonly handleBack = () => {
        this.#routerController.goBack();
    };

    public readonly toScriptPreparePlay = () => {
        this.#routerController.replace(
            RouterEnums.RouteName.ScriptPreparePlay,
            {
                ids: [this.#ctx.scriptId],
                options: {
                    animation: 'none',
                },
            },
        );
    };

    public readonly onChangeSpeed = () => {
        const { dramatizeEngineCtrl } = this.#relatedControllers ?? {};
        if (dramatizeEngineCtrl) {
            let currentSpeed = dramatizeEngineCtrl.state.speed;
            if (MathUtils.approximatelyEqual(currentSpeed, 1)) {
                currentSpeed = 1.5;
            } else if (MathUtils.approximatelyEqual(currentSpeed, 1.5)) {
                currentSpeed = 2;
            } else if (MathUtils.approximatelyEqual(currentSpeed, 2)) {
                currentSpeed = 0.75;
            } else {
                currentSpeed = 1;
            }

            dramatizeEngineCtrl.setSpeed(currentSpeed);
        }
    };
}
