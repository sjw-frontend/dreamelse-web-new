// @ts-nocheck
import type {
    ChapterListItem,
    DramatizeEngineController,
} from '$/component-controllers';
import {
    AppController,
    RouterController,
    ScriptController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService, FileService } from '$/services';
import type { WorldLineTypes } from '$/types';
import { FileUtils, MathUtils } from '$/utils';

type InternalState = LibTypes.VarDefine<{
    playId: string | null,
    title: string | null,
    isInteractionShow: boolean,
    showLoading: boolean,
    get showLottie(): boolean,

    totalChapterCount: number,
    isChapterDisplay: boolean,

    chapterId: string | null,

    progressCurrentValue: number,
    progressStartValue: number,
    progressMax: number,
    progressInteractions: LibTypes.VarArr<
        LibTypes.Define<{
            id: string,
            value: number,
        }>
    >,

    showChapterList: boolean,

    speed: number,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'chapterId'
    | 'isChapterDisplay'
    | 'isInteractionShow'
    | 'playId'
    | 'progressCurrentValue'
    | 'progressInteractions'
    | 'progressMax'
    | 'showChapterList'
    | 'showLoading'
    | 'showLottie'
    | 'speed'
    | 'title'
    | 'totalChapterCount'
>;

type Context = LibTypes.VarDefine<{
    scriptId: string | null,
    resource: WorldLineTypes.Api.RawResource | null,
    narratives: LibTypes.Arr<WorldLineTypes.Api.RawNarrative>,
    chapterList: LibTypes.Arr<ChapterListItem>,
}>;

type RelatedControllers = LibTypes.VarDefine<{
    dramatizeEngineCtrl: DramatizeEngineController,
}>;

@renderController()
export class PlayScriptHistoryController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        apiService: ApiService,
        appController: AppController,
        routerController: RouterController,
        scriptController: ScriptController,
        fileService: FileService,
    ) {
        super();
        this.#apiService = apiService;
        this.#routerController = routerController;
        this.#scriptController = scriptController;
        this.#appController = appController;
        this.#fileService = fileService;

        this.#init();
    }

    readonly #apiService;
    readonly #appController;
    readonly #routerController;
    readonly #scriptController;
    readonly #fileService;

    #relatedControllers?: RelatedControllers;

    readonly #ctx: Context = {
        scriptId: null,
        resource: null,
        narratives: [],
        chapterList: [],
    };

    #init() {
        const [scriptId, playId, chapterId] =
            this.internal.route?.params?.ids ?? [];
        const totalChapterCount = this.internal.route?.params?.value;

        if (scriptId != null && playId != null && chapterId != null) {
            this.#ctx.scriptId = scriptId.toString();
            this.internal.playId = playId.toString();
            this.internal.chapterId = chapterId.toString();

            this.internal.totalChapterCount =
                totalChapterCount == null
                    ? 0
                    : parseInt(totalChapterCount.toString());

            const scriptInfo = this.#scriptController.getScript(
                this.#ctx.scriptId,
            );

            this.internal.title = scriptInfo?.state.title ?? '';
        }
    }

    protected override getInitialInternalState(): InternalState {
        return {
            playId: null,
            chapterId: null,
            title: null,

            get showLottie() {
                return !this.isInteractionShow;
            },
            isInteractionShow: false,
            showLoading: true,

            totalChapterCount: 0,
            isChapterDisplay: true,

            progressCurrentValue: 0,
            progressStartValue: 0,
            progressMax: 0,
            progressInteractions: [],

            showChapterList: false,

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
                        const index = this.#ctx.chapterList.findIndex(
                            item => this.internal.chapterId === item.id,
                        );

                        const nextChapter = this.#ctx.chapterList[index + 1];

                        if (nextChapter) {
                            this.internal.chapterId = nextChapter.id;
                        }
                    }
                },
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.speed,
                speed => (this.internal.speed = speed),
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
                () => dramatizeEngineCtrl.state.isInteractionShow,
                isInteractionShow => {
                    this.internal.isInteractionShow = isInteractionShow;
                },
                {
                    immediate: true,
                },
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.isInteractHandling,
                isInteractHandling => {
                    this.internal.isChapterDisplay = !isInteractHandling;
                },
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.narrative,
                narrative => {
                    if (narrative) {
                        this.internal.progressCurrentValue =
                            narrative.state.index +
                            this.internal.progressStartValue;
                    }
                },
            ),
            this.watch(
                () => this.internal.chapterId,
                chapterId => {
                    if (chapterId != null) {
                        this.#appController.waitMoment(async () => {
                            const res =
                                await this.#apiService.call.play.query_act_narratives(
                                    {
                                        play_act_id: chapterId,
                                    },
                                );

                            this.#ctx.resource = res.resource;
                            this.#ctx.narratives = res.narratives;

                            this.#relatedControllers?.dramatizeEngineCtrl.startReplay(
                                {
                                    narratives: this.#ctx.narratives,
                                    resource: this.#ctx.resource,
                                    hasMore: false,
                                },
                            );

                            const progressInteractions: InternalState['progressInteractions'] =
                                [];

                            this.#ctx.narratives.forEach((item, index) => {
                                if (item.interaction) {
                                    progressInteractions.push({
                                        id: index.toString(),
                                        value: index,
                                    });
                                }
                            });

                            this.internal.progressCurrentValue = 0;
                            this.internal.progressStartValue = 0;
                            this.internal.progressInteractions =
                                progressInteractions;
                            this.internal.progressMax =
                                this.#ctx.narratives.length - 1;
                        });
                    }
                },
                {
                    immediate: true,
                },
            ),
            this.watch(
                () => this.internal.showChapterList,
                isBlur => {
                    dramatizeEngineCtrl.blur(isBlur);
                },
            ),
        );
    };

    public readonly handleBack = () => {
        this.#routerController.goBack();
    };

    public readonly selectChapter = (id: string) => {
        this.internal.chapterId = id;
        this.internal.showChapterList = false;
    };

    public readonly setChapterList = (list: LibTypes.Arr<ChapterListItem>) => {
        this.#ctx.chapterList = list;
    };

    public readonly restartChapter = async () => {
        await this.#appController.waitMoment(async () => {
            if (this.internal.playId != null) {
                await this.#apiService.call.play.delete({
                    play_id: this.internal.playId,
                });
                this.#ctx.scriptId != null &&
                    this.#scriptController.setScriptAttr(
                        this.#ctx.scriptId,
                        'dramatizeInfo.activePlayid',
                        null,
                    );
                this.#routerController.goBack();
                this.#routerController.replace(
                    RouterEnums.RouteName.ScriptPreparePlay,
                    {
                        ids: [this.#ctx.scriptId],
                    },
                );
            }
        });
    };

    public readonly toggleChapterListShow = () => {
        this.internal.showChapterList = !this.internal.showChapterList;
    };

    public readonly onSetProgressValue = (value: number) => {
        this.internal.progressStartValue = value;
        this.internal.progressCurrentValue = value;
        this.internal.showChapterList = false;
        this.#ctx.resource &&
            this.#relatedControllers?.dramatizeEngineCtrl.startReplay({
                narratives: this.#ctx.narratives.slice(value),
                resource: this.#ctx.resource,
                hasMore: false,

                requestAchievementImages: async (narrativeId: string) => {
                    if (this.internal.playId != null) {
                        const res =
                            await this.#apiService.call.play.query_achievement_appearance(
                                {
                                    play_id: this.internal.playId,
                                    narrative_id: narrativeId,
                                },
                            );

                        return res.appearances
                            .slice(0, 3)
                            .map(item =>
                                this.#fileService.createImageResource(
                                    item.image.id,
                                    FileUtils.getImageInfoFromApiInfo(
                                        item.image,
                                    ),
                                ));
                    }

                    return [];
                },
            });
    };

    public readonly rechoice = async (narrativeId: string, value: string) => {
        await this.#appController.waitMoment(async () => {
            if (this.internal.playId != null) {
                const res =
                    await this.#apiService.call.play.replay_from_narrative(
                        {
                            play_id: this.internal.playId,
                            narrative_id: narrativeId,
                            user_message: value,
                        },
                        {
                            isLongTask: true,
                        },
                    );
                this.#routerController.goBack();
                this.#routerController.replace(
                    RouterEnums.RouteName.PlayScript,
                    {
                        ids: [
                            this.#ctx.scriptId,
                            null,
                            res.play_id,
                            res.next_cursor,
                        ],
                    },
                );
            }
        });
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
