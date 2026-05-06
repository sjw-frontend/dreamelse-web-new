// @ts-nocheck
import {
    CharacterController,
    RouterController,
    ScriptController,
    UserController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService, FileService } from '$/services';
import type { FileTypes, ScriptTypes } from '$/types';
import { ArrayUtils, FileUtils, StringUtils, TaskUtils } from '$/utils';

import { Settings } from './home-const';
// import { HomeReport } from './home-report';

export type TagFeed = LibTypes.Define<{
    readonly id: string,
    readonly title: string,
    searchValue: number | null,
    scriptIds: LibTypes.Arr<ScriptTypes.ScriptId>,
    isAll?: boolean,
    readed?: boolean,
}>;

export type CharacterFeed = LibTypes.Define<{
    readonly id: string,
    scriptIds: LibTypes.Arr<ScriptTypes.ScriptId>,
    nextCursor: string | null,
    hasMore: boolean,
    readed: boolean,
}>;

type InternalState = LibTypes.VarDefine<{
    mode: 'character' | 'recommend' | 'tag',
    get isTagMode(): boolean,
    get isRecommendMode(): boolean,
    get isCharacterMode(): boolean,

    openSearch: boolean,
    searchPlaceholder: string,
    searchText: string | null,
    searchNextCursor: string | null,
    searchHasMore: boolean,
    searchScriptIds: LibTypes.Arr<ScriptTypes.ScriptId>,

    playWithCharacterList: LibTypes.Arr<{
        id: string,
        image: FileTypes.ImageResource,
    }>,
    currentPlayWithId: string | null,
    characterFeedList: LibTypes.Arr<CharacterFeed>,
    get currentCharacterFeed(): LibTypes.Nullable<CharacterFeed>,

    currentTagFeedId: string | null,
    tagFeedList: LibTypes.Arr<TagFeed>,
    get currentTagFeed(): LibTypes.Nullable<TagFeed>,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'characterFeedList'
    | 'currentPlayWithId'
    | 'currentTagFeedId'
    | 'isCharacterMode'
    | 'isRecommendMode'
    | 'isTagMode'
    | 'openSearch'
    | 'playWithCharacterList'
    | 'searchPlaceholder'
    | 'searchScriptIds'
    | 'searchText'
    | 'tagFeedList'
>;

// @withReport(HomeReport)
@renderController()
export class HomeController extends BaseRenderController<State, InternalState> {
    public constructor(
        scriptController: ScriptController,
        routerController: RouterController,
        userController: UserController,
        apiService: ApiService,
        characterController: CharacterController,
        fileService: FileService,
    ) {
        super();
        this.#scriptController = scriptController;
        this.#routerController = routerController;
        this.#userController = userController;
        this.#apiService = apiService;
        this.#characterController = characterController;
        this.#fileService = fileService;

        this.#watch();
        this.#init();
        this.#prefetch();
    }

    readonly #scriptController;
    readonly #routerController;
    readonly #userController;
    readonly #apiService;
    readonly #characterController;
    readonly #fileService;

    // #relatedControllers?: RelatedControllers;

    public readonly onPressScript = TaskUtils.createMutexTask(
        async (scriptInfo: ScriptTypes.FrozenScriptInfo) => {
            const openingLogId = scriptInfo.dramatizeInfo.openingId;
            const activePlayid = scriptInfo.dramatizeInfo.activePlayid;
            const activeRoleId = scriptInfo.dramatizeInfo.activeRoleId;

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
                this.#routerController.navigate(
                    RouterEnums.RouteName.PlayScript,
                    {
                        ids: [scriptInfo.id, activeRoleId, activePlayid],
                    },
                );
            }

            await this.untilNext(() => this.internal.routeFocused === true);
        },
    );

    #watch() {
        this.watch(
            () => this.#userController.state.loggedInUser,
            loggedInUser => {
                loggedInUser && this.#userController.requestScriptStats();
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () => this.internal.routeFocused,
            (routeFocused, _, unwatch) => {
                if (routeFocused === true) {
                    if (!this.#userController.state.loggedInUser) {
                        this.#routerController.toLogin();
                    }
                    unwatch();
                }
            },
        );

        this.watch(
            () =>
                !!this.#userController.state.loggedInUser &&
                this.internal.isCharacterMode,
            async isCharacterMode => {
                if (isCharacterMode) {
                    // TODO
                    const res =
                        await this.#apiService.call.feed.list_play_with_characters();
                    this.internal.playWithCharacterList = res.list.map(
                        item => ({
                            id: item.character_id,
                            image: this.#fileService.createImageResource(
                                item.appearance.id,
                                FileUtils.getImageInfoFromApiInfo(
                                    item.appearance,
                                ),
                            ),
                        }),
                    );
                    if (
                        this.internal.currentPlayWithId == null ||
                        !this.internal.playWithCharacterList.find(
                            item => item.id === this.internal.currentPlayWithId,
                        )
                    ) {
                        this.internal.currentPlayWithId =
                            this.internal.playWithCharacterList[0]?.id ?? null;
                    }

                    const list: LibTypes.VarArr<CharacterFeed> = [];

                    this.internal.playWithCharacterList.forEach(item => {
                        const oldInfo = this.internal.characterFeedList.find(
                            one => one.id === item.id,
                        );
                        if (oldInfo) {
                            list.push(oldInfo);
                        } else {
                            list.push({
                                id: item.id,
                                scriptIds: [],
                                nextCursor: null,
                                hasMore: true,
                                readed:
                                    this.internal.currentPlayWithId === item.id,
                            });
                        }
                    });
                    this.internal.characterFeedList = list;
                } else if (!this.#userController.state.loggedInUser) {
                    this.internal.playWithCharacterList = [];
                    this.internal.characterFeedList = [];
                }
            },
        );

        this.watch(
            () => this.#scriptController.state.defaultConfig,
            defaultConfig => {
                const currentAllTag = this.internal.tagFeedList[0];

                if (defaultConfig) {
                    this.internal.searchPlaceholder =
                        defaultConfig.feedSearchHint;

                    this.internal.tagFeedList = defaultConfig.feedTagList.map(
                        item => ({
                            id: item.index.toString(),
                            title: item.name,
                            searchValue: item.index,
                            scriptIds: [],
                        }),
                    );
                } else {
                    this.internal.tagFeedList = [];
                }

                this.internal.tagFeedList = [
                    currentAllTag ?? {
                        id: Settings.allTagId,
                        title: '',
                        searchValue: null,
                        scriptIds: [],
                        isAll: true,
                        readed: true,
                    },
                    ...this.internal.tagFeedList,
                ];

                this.internal.currentTagFeedId ??= Settings.allTagId;
            },
            {
                immediate: true,
            },
        );
    }

    #init() {
        this.#scriptController.requestDefaultConfig();
    }

    #prefetch() {
        this.#characterController.requestMyList();
    }

    protected override getInitialInternalState(): InternalState {
        return {
            mode: 'tag',
            get isTagMode() {
                return !this.openSearch && this.mode === 'tag';
            },
            get isRecommendMode() {
                return !this.openSearch && this.mode === 'recommend';
            },
            get isCharacterMode() {
                return !this.openSearch && this.mode === 'character';
            },

            openSearch: false,
            searchPlaceholder: '',
            searchText: null,
            searchNextCursor: null,
            searchHasMore: true,
            searchScriptIds: [],

            currentTagFeedId: null,
            tagFeedList: [],
            get currentTagFeed() {
                if (this.currentTagFeedId == null) {
                    return null;
                }

                return this.tagFeedList.find(
                    item => item.id === this.currentTagFeedId,
                );
            },

            playWithCharacterList: [],
            currentPlayWithId: null,
            characterFeedList: [],
            get currentCharacterFeed() {
                return this.characterFeedList.find(
                    item => item.id === this.currentPlayWithId,
                );
            },
        };
    }

    public readonly setMode = (mode: InternalState['mode']) =>
        (this.internal.mode = mode);

    public readonly changeTagFeedId = (id: string) => {
        this.internal.currentTagFeedId = id;

        const tagFeedList = [...this.internal.tagFeedList];
        const index = tagFeedList.findIndex(item => item.id === id);

        if (tagFeedList[index] && !tagFeedList[index].readed) {
            tagFeedList[index] = {
                ...tagFeedList[index],
                readed: true,
            };
            this.internal.tagFeedList = tagFeedList;
        }
    };

    public readonly setTagFeedScriptIds = (
        id: string,
        list: LibTypes.Arr<string>,
    ) => {
        const tagFeedList = [...this.internal.tagFeedList];
        const index = tagFeedList.findIndex(item => item.id === id);
        if (tagFeedList[index]) {
            tagFeedList[index] = {
                ...tagFeedList[index],
                scriptIds: list,
            };

            this.internal.tagFeedList = tagFeedList;
        }
    };

    public readonly changeCharacterFeedId = (id: string) => {
        this.internal.currentPlayWithId = id;

        const characterFeedList = [...this.internal.characterFeedList];
        const index = characterFeedList.findIndex(item => item.id === id);

        if (characterFeedList[index] && !characterFeedList[index].readed) {
            characterFeedList[index] = {
                ...characterFeedList[index],
                readed: true,
            };

            this.internal.characterFeedList = characterFeedList;
        }
    };

    public readonly setCharacterFeedScriptIds = (
        id: string,
        list: LibTypes.Arr<string>,
    ) => {
        const characterFeedList = [...this.internal.characterFeedList];
        const index = characterFeedList.findIndex(item => item.id === id);

        if (characterFeedList[index]) {
            const current = characterFeedList[index].scriptIds;
            if (
                current.length === list.length &&
                current.every((v, i) => v === list[i])
            ) {
                return;
            }

            characterFeedList[index] = {
                ...characterFeedList[index],
                scriptIds: list,
            };

            this.internal.characterFeedList = characterFeedList;
        }
    };

    public readonly openSearch = () => {
        if (this.#userController.isLoggedIn()) {
            this.internal.openSearch = true;
        }
    };

    public readonly closeSearch = () => (this.internal.openSearch = false);

    public readonly setSearchText = (text: string) =>
        (this.internal.searchText = text);

    public readonly search = (text: string) => {
        this.internal.searchText = text;
        this.internal.searchScriptIds = [];
        this.internal.searchNextCursor = null;
        this.internal.searchHasMore = true;
        this.requestSearch();
    };

    public readonly requestSearch = async () => {
        if (
            this.internal.searchHasMore &&
            !StringUtils.isEmpty(this.internal.searchText?.trim())
        ) {
            const res = await this.#scriptController.requestSearchList({
                keyword: this.internal.searchText?.trim() ?? '',
                nextCursor: this.internal.searchNextCursor,
            });
            this.internal.searchScriptIds = ArrayUtils.toDeduplicate([
                ...this.internal.searchScriptIds,
                ...res.ids,
            ]);
            this.internal.searchNextCursor = res.nextCursor;
            this.internal.searchHasMore = res.hasMore;
        }
    };

    public readonly handleSearchPress = () => {
        this.openSearch();
    };

    public readonly handleMePress = () => {
        this.#routerController.navigate(RouterEnums.RouteName.Me);
    };
}
