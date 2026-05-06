// @ts-nocheck
import type { DramatizeEngineController } from '$/component-controllers';
import {
    AppController,
    RouterController,
    ScriptController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService, FileService } from '$/services';
import type { ApiTypes, ScriptTypes } from '$/types';
import { FileUtils, MathUtils, StringUtils, TaskUtils } from '$/utils';

type InternalState = LibTypes.VarDefine<{
    playId: string | null,

    title: string | null,
    goal: string | null,
    get showGoal(): boolean,
    storyDesc: string | null,

    isInteractionShow: boolean,
    showLoading: boolean,

    get showLottie(): boolean,

    showLoadingRoles: boolean,
    roles: LibTypes.Arr<ScriptTypes.FrozenRoleInfo> | null,

    totalChapterCount: number,
    isChapterDisplay: boolean,

    showChapterList: boolean,
    isReviewShow: boolean,

    speed: number,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'goal'
    | 'isChapterDisplay'
    | 'isInteractionShow'
    | 'playId'
    | 'roles'
    | 'showChapterList'
    | 'showGoal'
    | 'showLoading'
    | 'showLoadingRoles'
    | 'showLottie'
    | 'speed'
    | 'storyDesc'
    | 'title'
    | 'totalChapterCount'
>;

type EventMap = LibTypes.Define<{
    startFail: LibTypes.SimpleFunction,
    end: LibTypes.Func<void, [isRegular: boolean]>,
}>;

type Context = LibTypes.VarDefine<{
    scriptId: string | null,
    activePlayId: string | null,
    nextCursor: string | null,
    selectRoleId: string | null,
}>;

type RelatedControllers = LibTypes.VarDefine<{
    dramatizeEngineCtrl: DramatizeEngineController,
}>;

@renderController()
export class PlayScriptController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        apiService: ApiService,
        routerController: RouterController,
        scriptController: ScriptController,
        appController: AppController,
        fileService: FileService,
    ) {
        super();
        this.#apiService = apiService;
        this.#routerController = routerController;
        this.#scriptController = scriptController;
        this.#appController = appController;
        this.#fileService = fileService;

        this.#watch();
        // #init() moved to setRelatedControllers — route params not available in constructor on web
    }

    readonly #apiService;
    readonly #routerController;
    readonly #scriptController;
    readonly #appController;
    readonly #fileService;

    #relatedControllers?: RelatedControllers;

    readonly #ctx: Context = {
        scriptId: null,
        activePlayId: null,
        nextCursor: null,
        selectRoleId: null,
    };

    public readonly selectChapter = TaskUtils.createMutexTask(
        async (id: string) => {
            if (this.#ctx.scriptId != null && this.internal.playId != null) {
                this.#routerController.navigate(
                    RouterEnums.RouteName.PlayScriptHistory,
                    {
                        ids: [this.#ctx.scriptId, this.internal.playId, id],
                        value: this.internal.totalChapterCount,
                    },
                );

                await this.untilNext(() => this.internal.routeFocused === true);
            }
        },
    );

    #watch() {
        // TODO 忘了是干嘛的，先去掉
        // this.watch(
        //     () => this.internal.unmounted,
        //     unmounted => {
        //         if (unmounted && this.#ctx.scriptId != null) {
        //             this.#scriptController.requestPlayDetails(
        //                 this.#ctx.scriptId,
        //             );
        //         }
        //     },
        // );
    }

    #init() {
        const [scriptId, selectRoleId, activePlayId, nextCursor] =
            this.internal.route?.params?.ids ?? [];

        this.#ctx.scriptId = scriptId?.toString() ?? null;
        this.#ctx.activePlayId = activePlayId?.toString() ?? null;
        this.#ctx.selectRoleId = selectRoleId?.toString() ?? null;
        this.#ctx.nextCursor = nextCursor?.toString() ?? null;

        console.log('[PlayScript] #init', {
            scriptId: this.#ctx.scriptId,
            selectRoleId: this.#ctx.selectRoleId,
            activePlayId: this.#ctx.activePlayId,
            nextCursor: this.#ctx.nextCursor,
            rawIds: this.internal.route?.params?.ids,
        });
    }

    async #start() {
        console.log('[PlayScript] #start begin', { scriptId: this.#ctx.scriptId });
        try {
            if (this.#ctx.scriptId != null) {
                let scriptInfo = this.#scriptController.getScript(
                    this.#ctx.scriptId,
                );
                console.log('[PlayScript] scriptInfo from cache', !!scriptInfo);

                scriptInfo ??= await this.#scriptController.requestPlayDetails(
                    this.#ctx.scriptId,
                );
                console.log('[PlayScript] scriptInfo loaded', {
                    title: scriptInfo?.state.title,
                    rolesCount: scriptInfo?.state.roles?.length,
                });

                if (this.#ctx.selectRoleId != null) {
                    if (scriptInfo.state.roles == null) {
                        await this.#scriptController.requestPlayDetails(
                            this.#ctx.scriptId,
                        );
                    }
                }

                const roleInfo = scriptInfo.state.roles?.find(
                    item => item.id === this.#ctx.selectRoleId,
                );
                this.internal.goal = roleInfo?.state.roleGoal ?? null;

                if (roleInfo) {
                    this.internal.roles = [roleInfo];
                } else {
                    this.internal.storyDesc = scriptInfo.state.storyDesc;
                    this.internal.roles = scriptInfo.state.roles;
                }

                let playId;

                if (this.#ctx.activePlayId == null) {
                    console.log('[PlayScript] calling play.start', { script_id: this.#ctx.scriptId });
                    const startRes = await this.#apiService.call.play.start(
                        {
                            script_id: this.#ctx.scriptId,

                            selected_role_id: roleInfo?.isLocal
                                ? undefined
                                : roleInfo?.id,
                            selected_temp_role_id: roleInfo?.isLocal
                                ? roleInfo.id
                                : undefined,

                            added_roles: scriptInfo.state.roles
                                ?.filter(item => item.isLocal)
                                .map(item =>
                                    this.#scriptController.createApiRole(item)),
                            tbd_role_binds: scriptInfo.state.roles
                                ?.filter(item => item.isOpen)
                                .map(item =>
                                    this.#scriptController.createApiRole(item)),

                            // deprecate_play_id:
                            //     this.#ctx.activePlayId ?? undefined,
                        },
                        { isLongTask: true },
                    );

                    playId = startRes.play_id;
                    console.log('[PlayScript] play.start success', { playId });

                    this.#scriptController.setScriptAttr(
                        this.#ctx.scriptId,
                        'dramatizeInfo.activePlayid',
                        playId,
                    );

                    this.#scriptController.setScriptAttr(
                        this.#ctx.scriptId,
                        'dramatizeInfo.activeRoleId',
                        this.#ctx.selectRoleId,
                    );
                } else {
                    playId = this.#ctx.activePlayId;

                    if (this.#ctx.nextCursor == null) {
                        const lastCursorRes =
                            await this.#apiService.call.play.query_last_cursor({
                                play_id: playId,
                            });

                        this.#ctx.nextCursor = lastCursorRes.next_cursor;
                    }
                }

                let bg: ApiTypes.Protocol.Media | null = null;
                console.log('[PlayScript] calling dramatizeEngineCtrl.startPlay', { playId, hasRelatedControllers: !!this.#relatedControllers });
                this.#relatedControllers?.dramatizeEngineCtrl.startPlay({
                    requestNarrativesCallback: async () => {
                        console.log('[PlayScript] requestNarrativesCallback called', { playId, nextCursor: this.#ctx.nextCursor });
                        const res = await this.#apiService.call.play.query_next(
                            {
                                play_id: playId,
                                next_cursor: this.#ctx.nextCursor ?? undefined,
                            },
                            {
                                isLongTask: true,
                            },
                        );

                        this.#ctx.nextCursor = res.next_cursor;
                        console.log('[PlayScript] query_next result', {
                            narrativesCount: res.narratives?.length,
                            hasMore: res.has_more,
                            nextCursor: res.next_cursor,
                        });

                        if (bg == null && this.#ctx.scriptId != null) {
                            bg =
                                res.resource.background[0]?.images?.[0] ?? null;
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
                    },
                    requestContinueCallback: async ({ narrativeId, value }) => {
                        const res = await this.#apiService.call.play.continue(
                            {
                                play_id: playId,
                                narrative_id: narrativeId,
                                user_response: value,
                            },
                            { isLongTask: true },
                        );

                        this.#ctx.nextCursor = res.next_cursor;
                    },
                    requestAchievementImages: async (narrativeId: string) => {
                        const res =
                            await this.#apiService.call.play.query_achievement_appearance(
                                {
                                    play_id: playId,
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
                    },
                });

                console.log('[PlayScript] dramatizeEngineCtrl.startPlay called, playId=', playId);
                this.internal.playId = playId;
            }
        } catch (e) {
            console.error('startFail', e);
            this.emitEvent('startFail');
        }
    }

    protected override getInitialInternalState(): InternalState {
        return {
            playId: null,

            title: null,
            goal: null,
            get showGoal() {
                return (
                    !this.showLoadingRoles && !StringUtils.isEmpty(this.goal)
                );
            },
            storyDesc: null,

            get showLottie() {
                return !this.showLoadingRoles && !this.isInteractionShow;
            },
            isInteractionShow: false,
            showLoading: true,
            showLoadingRoles: true,
            roles: null,

            totalChapterCount: 0,
            isChapterDisplay: true,

            showChapterList: false,
            isReviewShow: false,

            speed: 1,
        };
    }

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        console.log('[PlayScript] setRelatedControllers called');
        this.#init(); // route params available here on web
        this.#relatedControllers = relatedControllers;
        const { dramatizeEngineCtrl } = relatedControllers;

        this.autoClearRelatedControllers(
            dramatizeEngineCtrl.addEventListener('pressCanvas', () => {
                if (this.internal.showChapterList) {
                    this.toggleChapterListShow();
                }
            }),
            this.watch(
                () => dramatizeEngineCtrl.state.speed,
                speed => (this.internal.speed = speed),
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.isWorldLineEnd,
                isWorldLineEnd => {
                    if (isWorldLineEnd) {
                        this.emitEvent(
                            'end',
                            !!dramatizeEngineCtrl.state.narrative?.state
                                .director.interaction?.isEnd,
                        );
                        !this.internal.showChapterList &&
                            this.toggleChapterListShow();
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
                    this.internal.showLoadingRoles = isWaitFirst;
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
                () =>
                    dramatizeEngineCtrl.state.narrative?.state.isFinished &&
                    dramatizeEngineCtrl.state.narrative.state.narrativeId,
                value => {
                    if (
                        typeof value === 'string' &&
                        this.internal.playId != null
                    ) {
                        this.#apiService.call.play.report_played_narrative_id({
                            play_id: this.internal.playId,
                            narrative_id: value,
                        });
                    }
                },
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.narrative?.state.chapterIndex,
                chapterIndex => {
                    if (chapterIndex != null) {
                        this.internal.totalChapterCount = chapterIndex;
                    }
                },
            ),
            this.watch(
                () => dramatizeEngineCtrl.state.isInteractHandling,
                isInteractHandling => {
                    this.internal.isChapterDisplay = !isInteractHandling;
                },
            ),
            this.watch(
                () =>
                    this.internal.showChapterList || this.internal.isReviewShow,
                isBlur => {
                    dramatizeEngineCtrl.blur(isBlur);
                },
            ),
        );

        this.#start();
    };

    public readonly handleBack = () => {
        this.#routerController.goBack();
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

    public readonly onShowReview = (show: boolean) => {
        this.internal.isReviewShow = show;
        if (show) {
            return (
                this.#relatedControllers?.dramatizeEngineCtrl.state
                    .nextNarrative?.state.narrativeId ??
                this.#relatedControllers?.dramatizeEngineCtrl.state.narrative
                    ?.state.narrativeId ??
                null
            );
        }

        return null;
    };
}
