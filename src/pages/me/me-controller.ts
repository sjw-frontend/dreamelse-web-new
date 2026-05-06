// @ts-nocheck
import {
    RouterController,
    ScriptController,
    UserController,
    WorldLineController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService, DeviceService } from '$/services';
import type { ScriptTypes, WorldLineTypes } from '$/types';
import { ArrayUtils, StringUtils } from '$/utils';

type ListInfo = LibTypes.Define<{
    ids: LibTypes.Arr<ScriptTypes.ScriptId>,
    hasMore: boolean,
    nextCursor: string | null,
}>;

type InternalState = LibTypes.VarDefine<{
    tab: 'collect' | 'create' | 'memory' | 'play',
    get isPlay(): boolean,
    get isCreate(): boolean,
    get isCollect(): boolean,
    get isMemory(): boolean,

    playScript: ListInfo,
    createScript: ListInfo,
    collectScript: ListInfo,

    draftScript: ListInfo,

    get nickname(): string | undefined,
    get uniqueId(): string | undefined,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'collectScript'
    | 'createScript'
    | 'isCollect'
    | 'isCreate'
    | 'isMemory'
    | 'isPlay'
    | 'nickname'
    | 'playScript'
    | 'uniqueId'
>;

@renderController()
export class MeController extends BaseRenderController<State, InternalState> {
    public constructor(
        userController: UserController,
        routerController: RouterController,
        deviceService: DeviceService,
        apiService: ApiService,
        worldLineController: WorldLineController,
        scriptController: ScriptController,
    ) {
        super();
        this.#userController = userController;
        this.#routerController = routerController;
        this.#deviceService = deviceService;
        this.#apiService = apiService;
        this.#worldLineController = worldLineController;
        this.#scriptController = scriptController;

        this.#watch();
    }

    readonly #userController;
    readonly #routerController;
    readonly #deviceService;
    readonly #apiService;
    readonly #worldLineController;
    readonly #scriptController;

    #watch() {
        this.watch(
            () =>
                this.internal.isPlay &&
                this.internal.playScript.ids.length === 0,
            value => {
                value && this.requestPlayList();
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () =>
                this.internal.isCreate &&
                this.internal.createScript.ids.length === 0,
            value => {
                value && this.requestCreateList();
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () =>
                this.internal.isCollect &&
                this.internal.collectScript.ids.length === 0,
            value => {
                value && this.requestCollectList();
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () => this.internal.routeFocused === true,
            routeFocused => {
                if (routeFocused) {
                    this.#userController.requestScriptStats();
                }
            },
            {
                immediate: true,
            },
        );
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            tab: 'play',
            get isPlay() {
                return this.tab === 'play';
            },
            get isCreate() {
                return this.tab === 'create';
            },
            get isCollect() {
                return this.tab === 'collect';
            },
            get isMemory() {
                return this.tab === 'memory';
            },

            playScript: {
                ids: [],
                hasMore: true,
                nextCursor: null,
            },
            createScript: {
                ids: [],
                hasMore: true,
                nextCursor: null,
            },
            collectScript: {
                ids: [],
                hasMore: true,
                nextCursor: null,
            },

            draftScript: {
                ids: [],
                hasMore: true,
                nextCursor: null,
            },

            get nickname() {
                return $this.#userController.state.loggedInUser?.state.nickname;
            },
            get uniqueId() {
                return $this.#userController.state.loggedInUser?.uniqueId;
            },
        };
    }

    public readonly setTab = (tab: InternalState['tab']) => {
        this.internal.tab = tab;
    };

    public readonly goBack = () => this.#routerController.resetToHome();

    public readonly toSettings = () => {
        this.#routerController.navigate(RouterEnums.RouteName.UserSettings);
    };

    public readonly copyToClipboard = async (text: string) =>
        this.#deviceService.copyToClipboard(text);

    public readonly updateUsername = (name: string) => {
        if (this.#userController.state.loggedInUser) {
            this.#userController.setMyState('nickname', name);

            this.#apiService.call.user.update_user_info({
                user_name: name,
            });
        }
    };

    public readonly requestPlayList = async (clear = false) => {
        if (clear) {
            this.internal.playScript = {
                ids: this.internal.playScript.ids,
                hasMore: true,
                nextCursor: null,
            };
        }

        if (this.internal.playScript.hasMore) {
            const res = await this.#worldLineController.requestMyPlayList(
                this.internal.playScript.nextCursor,
            );

            if (clear) {
                this.internal.playScript = {
                    ids: [],
                    hasMore: true,
                    nextCursor: null,
                };
            }

            this.internal.playScript = {
                ids: ArrayUtils.toDeduplicate([
                    ...this.internal.playScript.ids,
                    ...res.ids,
                ]),
                hasMore: res.hasMore,
                nextCursor: res.nextCursor,
            };
        }
    };

    public readonly refreshPlayList = async () => this.requestPlayList(true);

    public readonly requestCreateList = async (clear = false) => {
        if (clear) {
            this.internal.createScript = {
                ids: this.internal.createScript.ids,
                hasMore: true,
                nextCursor: null,
            };
        }

        if (this.internal.createScript.hasMore) {
            const res = await this.#scriptController.requestMyList(
                this.internal.createScript.nextCursor,
            );

            if (clear) {
                this.internal.createScript = {
                    ids: [],
                    hasMore: true,
                    nextCursor: null,
                };
            }

            this.internal.createScript = {
                ids: ArrayUtils.toDeduplicate([
                    ...this.internal.createScript.ids,
                    ...res.ids,
                ]),
                hasMore: res.hasMore,
                nextCursor: res.nextCursor,
            };
        }
    };

    public readonly refreshCreateList = async () =>
        this.requestCreateList(true);

    public readonly requestCollectList = async (clear = false) => {
        if (clear) {
            this.internal.collectScript = {
                ids: this.internal.collectScript.ids,
                hasMore: true,
                nextCursor: null,
            };
        }

        if (this.internal.collectScript.hasMore) {
            const res = await this.#scriptController.requestMyCollectList(
                this.internal.collectScript.nextCursor,
            );

            if (clear) {
                this.internal.collectScript = {
                    ids: [],
                    hasMore: true,
                    nextCursor: null,
                };
            }

            this.internal.collectScript = {
                ids: ArrayUtils.toDeduplicate([
                    ...this.internal.collectScript.ids,
                    ...res.ids,
                ]),
                hasMore: res.hasMore,
                nextCursor: res.nextCursor,
            };
        }
    };

    public readonly refreshCollectList = async () =>
        this.requestCollectList(true);

    public readonly toCreateStory = () => {
        this.#routerController.navigate(RouterEnums.RouteName.ScriptEdit);
    };

    public readonly toDraftBox = () => {
        this.#routerController.navigate(RouterEnums.RouteName.ScriptDraft);
    };

    public readonly collectListOnItemChange = (
        info: ScriptTypes.FrozenScriptInfo,
    ) => {
        if (!info.state.isCollected) {
            this.internal.collectScript = {
                ...this.internal.collectScript,
                ids: this.internal.collectScript.ids.filter(
                    item => item !== info.id,
                ),
            };
        }
    };

    public readonly onPressScript = (
        scriptInfo: ScriptTypes.FrozenScriptInfo,
    ) => {
        const openingLogId = scriptInfo.dramatizeInfo.openingId;
        const activePlayid = scriptInfo.dramatizeInfo.activePlayid;

        if (StringUtils.isEmpty(activePlayid)) {
            if (StringUtils.isEmpty(openingLogId)) {
                this.#routerController.navigate(
                    RouterEnums.RouteName.ScriptPreparePlay,
                    {
                        ids: [scriptInfo.id],
                    },
                );
            } else {
                this.#routerController.navigate(
                    RouterEnums.RouteName.PlayScriptOpening,
                    {
                        ids: [scriptInfo.id, openingLogId],
                        value: true,
                    },
                );
            }
        } else {
            this.#routerController.navigate(RouterEnums.RouteName.PlayScript, {
                ids: [scriptInfo.id, null, activePlayid],
            });
        }
    };

    public readonly onPressPlayedScript = (
        info: WorldLineTypes.FrozenWorldLineInfo,
    ) => {
        const activePlayid = info.id;

        if (!StringUtils.isEmpty(activePlayid)) {
            this.#routerController.navigate(RouterEnums.RouteName.PlayScript, {
                ids: [info.scriptId, info.roleId, activePlayid],
            });
        }
    };
}
