// @ts-nocheck
import { cloneDeep } from 'lodash';

import { BaseZoneController, zoneController } from '$/core';
import { DataStoreDomain, DataStoreRemoteDomain } from '$/domains';
import { ScriptEnums } from '$/enums';
import { ApiService, FileService } from '$/services';
import type { ApiTypes, ScriptTypes } from '$/types';
import { FileUtils, ObjectUtils, StringUtils, TaskUtils } from '$/utils';

import { AppController } from '../app/app-controller';
import { CharacterController } from '../character/character-controller';
import { UserController } from '../user/user-controller';

import { Settings } from './script-const';

type InternalState = LibTypes.VarDefine<{
    defaultConfig: ScriptTypes.DefaultConfig | null,
    waitNarrativeLoadingTextList: LibTypes.Arr<string>,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    'defaultConfig' | 'waitNarrativeLoadingTextList'
>;

@zoneController()
export class ScriptController extends BaseZoneController<State, InternalState> {
    public constructor(
        apiService: ApiService,
        fileService: FileService,
        characterController: CharacterController,
        userController: UserController,
        appController: AppController,
    ) {
        super();
        this.#apiService = apiService;
        this.#fileService = fileService;
        this.#characterController = characterController;
        this.#userController = userController;
        this.#appController = appController;

        this.#watch();
    }

    readonly #apiService;
    readonly #fileService;
    readonly #characterController;
    readonly #userController;
    readonly #appController;

    #scriptId = -1;
    #roleId = -1;
    #identityId = -1;

    #platformUserId = -1;

    readonly #requestDefaultConfigTask = TaskUtils.createMergeTask(async () =>
        Promise.all([
            this.#apiService.call.feed.tags(),
            this.#apiService.call.feed.get_search_hint(),
            this.#apiService.call.script.list_script_types(),
        ]));

    //#region dataStore
    readonly #roleDataStore = this.getDomain(
        DataStoreDomain<ScriptTypes.RoleState, ScriptTypes.RoleAttrs>,
    );

    readonly #draftDataStore = this.getDomain(
        DataStoreRemoteDomain<ScriptTypes.DraftState, ScriptTypes.DraftAttrs>,
    );

    readonly #scriptDataStore = this.getDomain(
        DataStoreRemoteDomain<ScriptTypes.ScriptState, ScriptTypes.ScriptAttrs>,
        {
            dataSizeLimit: Settings.dataSizeLimit,
        },
    );
    //#endregion

    //#region set value
    public readonly setRoleState = this.#roleDataStore.setState;
    public readonly getRole = this.#roleDataStore.get;

    public readonly setDraftState = this.#draftDataStore.setState;
    public readonly getDraft = this.#draftDataStore.get;

    public readonly setScriptState = this.#scriptDataStore.setState;
    public readonly setScriptAttr = this.#scriptDataStore.setAttr; // TODO 不要暴露
    public readonly getScript = this.#scriptDataStore.get;
    //#endregion

    #watch() {
        this.watch(
            () => this.#userController.state.loggedInUser,
            () => {
                this.requestDefaultConfig();
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () => this.#appController.state.remoteConfig,
            remoteConfig => {
                this.internal.waitNarrativeLoadingTextList =
                    remoteConfig.waitNarrativeLoadingTextList ?? [];
            },
            {
                immediate: true,
            },
        );
    }

    //#region create
    #createRoleState(initialState: ScriptTypes.InitialRoleState) {
        const $this = this;
        let characterId = initialState.characterId;
        let characterInfo =
            characterId != null
                ? this.#characterController.getCharacter(characterId)
                : null;

        const roleState: ScriptTypes.RoleState = {
            ...initialState,
            get characterId() {
                return characterId;
            },
            set characterId(value: string | null) {
                characterId = value;
                if (characterId != null) {
                    characterInfo =
                        $this.#characterController.getCharacter(characterId);
                }
            },
            get characterInfo() {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                this.characterId;
                return characterInfo ?? null;
            },
        };

        return roleState;
    }

    #createRawScript(
        id: ScriptTypes.ScriptId,
        isLocal: boolean,
        attrs: ScriptTypes.InitialScriptAttrs,
        state: ScriptTypes.InitialScriptState,
    ) {
        const info: ScriptTypes.ScriptInfo = {
            ...attrs,
            isLocal,
            id,
            state: this.#createScriptState(state),
        };

        return info;
    }

    #createRawDraft(
        isLocal: boolean,
        attrs: ScriptTypes.DraftAttrs,
        state: ScriptTypes.DraftState,
    ) {
        const info: ScriptTypes.DraftInfo = {
            ...attrs,
            isLocal,
            id: attrs.scriptInfo.id,
            state,
        };

        return info;
    }

    #createNewDraft(scriptInfo: ScriptTypes.FrozenScriptInfo) {
        const attrs: ScriptTypes.DraftAttrs = {
            scriptInfo,
            version: null,
        };

        const state: ScriptTypes.DraftState = {
            title: '',
            storyDesc: '',
            openingDesc: '',

            roles: null,
            branches: null,

            kinds: [],

            fullyCustomRole: null,
            status: ScriptEnums.Status.Draft,
        };

        return this.#draftDataStore.create(
            this.#createRawDraft(true, attrs, state),
        );
    }

    #createScriptState(initialScriptState: ScriptTypes.InitialScriptState) {
        const $this = this;

        const state: ScriptTypes.ScriptState = {
            ...initialScriptState,
            get isOwner() {
                return (
                    this.author?.id ===
                    $this.#userController.state.loggedInUser?.id
                );
            },
        };

        return state;
    }

    //#endregion

    //#region handle Api info
    async #getRolesFromApiInfo(apiInfo: ScriptTypes.ApiScriptInfo) {
        const roles =
            apiInfo.fixed_roles || apiInfo.tbd_roles || apiInfo.npc_roles
                ? [
                      ...(await Promise.all(
                          apiInfo.fixed_roles?.map(item =>
                              this.#upsertRoleFromApiInfo(item, false)) ?? [],
                      )),
                      ...(await Promise.all(
                          apiInfo.tbd_roles?.map(item =>
                              this.#upsertRoleFromApiInfo(item, false)) ?? [],
                      )),
                      ...(await Promise.all(
                          apiInfo.npc_roles?.map(item =>
                              this.#upsertRoleFromApiInfo(item, true)) ?? [],
                      )),
                  ]
                : null;

        return roles;
    }

    #getCoverSceneInfoFromApiInfo(
        sceneKey: string | null,
        apiInfo: ScriptTypes.ApiScriptInfo,
        scriptInfo: ScriptTypes.FrozenScriptInfo | undefined,
    ) {
        const currentSceneInfo = ObjectUtils.getValue(
            scriptInfo?.state.sceneInfoRecord,
            sceneKey,
        );

        const sceneInfo: ScriptTypes.SceneInfo | null =
            sceneKey == null
                ? null
                : {
                      backgroundImage: apiInfo.pgc_bkg_media
                          ? this.#fileService.createImageResource(
                                apiInfo.pgc_bkg_media.id,
                                FileUtils.getImageInfoFromApiInfo(
                                    apiInfo.pgc_bkg_media,
                                ),
                            )
                          : (currentSceneInfo?.backgroundImage ?? null),
                      bgColor:
                          apiInfo.bkg_main_color ??
                          currentSceneInfo?.bgColor ??
                          null,
                      cover: apiInfo.bkg_media
                          ? this.#fileService.createImageResource(
                                apiInfo.bkg_media.id,
                                FileUtils.getImageInfoFromApiInfo(
                                    apiInfo.bkg_media,
                                ),
                            )
                          : (currentSceneInfo?.cover ?? null),
                      coverRoles:
                          apiInfo.appearance_medias?.map(item =>
                              this.#fileService.createImageResource(
                                  item.id,
                                  FileUtils.getImageInfoFromApiInfo(item),
                              )) ??
                          currentSceneInfo?.coverRoles ??
                          [],
                  };

        return sceneInfo;
    }

    #createBaseScriptStateFromApiInfo(
        apiInfo: ScriptTypes.ApiScriptInfo,
        currentState:
            | LibTypes.FrozenDefine<ScriptTypes.BaseScriptState>
            | undefined,
        resolvedRoles: ScriptTypes.RoleInfo[] | null,
    ) {
        const roles = resolvedRoles ?? currentState?.roles ?? null;

        const branches = apiInfo.story_flow ?? currentState?.branches ?? null;

        const result: ScriptTypes.BaseScriptState = {
            roles,
            branches,

            title: apiInfo.title ?? currentState?.title ?? '',

            storyDesc: apiInfo.story ?? currentState?.storyDesc ?? '',

            openingDesc:
                apiInfo.opening_story ?? currentState?.openingDesc ?? '',

            kinds:
                apiInfo.story_types?.map(item => ({
                    id: item,
                    label: item,
                })) ??
                currentState?.kinds ??
                null,
        };

        return result;
    }

    #createRawDraftFromApiInfo(
        scriptInfo: ScriptTypes.FrozenScriptInfo,
        apiInfo: ScriptTypes.ApiScriptInfo,
    ) {
        const id = apiInfo.script_id;
        const draftInfo = this.#draftDataStore.get(id);

        const fullyCustomRole =
            apiInfo.role_arrangement_type == null
                ? draftInfo?.state.fullyCustomRole
                : apiInfo.role_arrangement_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                  ScriptEnums.ApiRoleArrangement.LetPlayer;

        const info: ScriptTypes.DraftInfo = this.#createRawDraft(
            false,
            {
                version: apiInfo.draft_version ?? draftInfo?.version,
                scriptInfo,
            },
            {
                ...this.#createBaseScriptStateFromApiInfo(
                    apiInfo,
                    draftInfo?.state,
                    draftInfo?.state.roles ?? null,
                ),

                fullyCustomRole,
                status:
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    (apiInfo.draft_status as ScriptEnums.Status | undefined) ??
                    draftInfo?.state.status,
            },
        );

        return info;
    }

    async #upsertDraftFromApiInfo(apiInfo: ScriptTypes.ApiScriptInfo) {
        let scriptInfo = this.#scriptDataStore.get(apiInfo.script_id);
        if (!scriptInfo) {
            if (apiInfo.last_published_version == null) {
                scriptInfo = await this.#upsertScriptFromApiInfo(apiInfo, null);
            } else {
                scriptInfo = await this.requestDetails(apiInfo.script_id);
            }
        }

        const info = await this.#draftDataStore.upsert(
            this.#createRawDraftFromApiInfo(scriptInfo, apiInfo),
        );

        return info;
    }

    async #upsertRoleFromApiInfo(
        apiRole: ApiTypes.Protocol.ScriptRole,
        isNpc: boolean,
    ) {
        const characterApiInfo = apiRole.character_info;
        if (characterApiInfo?.character_id != null) {
            await this.#characterController.upsertFormApiInfo(
                {
                    character_id: characterApiInfo.character_id,
                    name: characterApiInfo.name,
                    aka: characterApiInfo.aka,
                    current_outfit_id: characterApiInfo.outfit_id,
                },
                false,
            );
        }

        const id = apiRole.role_id ?? '';
        const roleInfo = this.#roleDataStore.get(id);

        const info = this.#roleDataStore.upsert({
            id,
            isLocal: false,

            isOpen: !apiRole.character_info,
            isNpc,

            state: this.#createRoleState({
                identities: apiRole.identities.map(item =>
                    this.createNewIdentity(item, true)),

                backgroundDesc:
                    apiRole.background ?? roleInfo?.state.backgroundDesc ?? '',

                supplementBackgroundDesc:
                    apiRole.extra_background ??
                    roleInfo?.state.supplementBackgroundDesc ??
                    '',

                secret: apiRole.secret ?? roleInfo?.state.secret ?? '',
                roleGoal: apiRole.goal ?? roleInfo?.state.roleGoal ?? '',
                characterId:
                    apiRole.character_info?.character_id ??
                    roleInfo?.state.characterId ??
                    null,
            }),
        });

        return info;
    }

    async #upsertRoleImagesFromApiInfo(apiInfo: ScriptTypes.ApiScriptInfo) {
        const allRoles = [
            ...(apiInfo.fixed_roles ?? []),
            ...(apiInfo.tbd_roles ?? []),
            ...(apiInfo.npc_roles ?? []),
        ];
        await Promise.all(
            allRoles.map(async apiRole => {
                const characterApiInfo = apiRole.character_info;
                if (characterApiInfo?.character_id != null && characterApiInfo.image) {
                    await this.#characterController.updateDefaultFigureSkinByApiMedia(
                        characterApiInfo.character_id,
                        characterApiInfo.image,
                        characterApiInfo.bkg_main_color,
                    );
                }
            }),
        );
    }

    async #upsertScriptFromApiInfo(
        apiInfo: ScriptTypes.ApiScriptInfo,
        sceneKey: string | null,
    ) {
        const id = apiInfo.script_id;

        const scriptInfo = this.#scriptDataStore.get(id);

        const sceneInfo = this.#getCoverSceneInfoFromApiInfo(
            sceneKey,
            apiInfo,
            scriptInfo,
        );

        const sceneInfoRecord = {
            ...scriptInfo?.state.sceneInfoRecord,
            ...(sceneKey == null
                ? null
                : {
                      [sceneKey]: sceneInfo,
                  }),
        };

        const author: ScriptTypes.ScriptState['author'] = apiInfo.author
            ? {
                  id: apiInfo.author.is_platform
                      ? `s-${this.#platformUserId--}`
                      : apiInfo.author.uid,
                  name: apiInfo.author.user_name,
                  isPlatform: apiInfo.author.is_platform,
              }
            : scriptInfo?.state.author;

        const resolvedRoles = await this.#getRolesFromApiInfo(apiInfo);
        await this.#upsertRoleImagesFromApiInfo(apiInfo);

        const attrs: ScriptTypes.InitialScriptAttrs = {
            version: apiInfo.version ?? scriptInfo?.version,

            dramatizeInfo: {
                openingId:
                    apiInfo.script_opening_id ??
                    scriptInfo?.dramatizeInfo.openingId,
                activePlayid:
                    apiInfo.active_play_id ??
                    scriptInfo?.dramatizeInfo.activePlayid,
                activeRoleId:
                    apiInfo.active_play_role_id ??
                    scriptInfo?.dramatizeInfo.activeRoleId,
            },

            impressionId: apiInfo.impression_id ?? scriptInfo?.impressionId,

            draftInfo: scriptInfo?.draftInfo ?? null,
        };

        const state: ScriptTypes.InitialScriptState = {
            ...this.#createBaseScriptStateFromApiInfo(
                apiInfo,
                scriptInfo?.state,
                resolvedRoles,
            ),

            sceneInfoRecord,
            author,

            label: apiInfo.corner_tag ?? scriptInfo?.state.label ?? '',
            labelKind: apiInfo.corner_tag_style,

            isCollected: !!(
                apiInfo.is_favourite ?? scriptInfo?.state.isCollected
            ),

            tags:
                apiInfo.tags?.map(item => ({
                    id: item,
                    label: item,
                })) ??
                scriptInfo?.state.tags ??
                [],

            publishTime: apiInfo.publish_time ?? scriptInfo?.state.publishTime,
            updateTime: apiInfo.update_time ?? scriptInfo?.state.updateTime,
            favouriteTime:
                apiInfo.favourite_time ?? scriptInfo?.state.favouriteTime,
            lastPlayTime:
                apiInfo.last_play_time ?? scriptInfo?.state.lastPlayTime,

            preparePlayBackgroundImage:
                scriptInfo?.state.preparePlayBackgroundImage ?? null,
        };

        const rawInfo = this.#createRawScript(id, false, attrs, state);

        const info = scriptInfo ?? this.#scriptDataStore.create(rawInfo);

        if (!info.draftInfo) {
            const draftInfo = this.#createNewDraft(info);
            this.#scriptDataStore.setAttrSync(id, 'draftInfo', draftInfo);
        }

        await this.#draftDataStore.setAttr(
            id,
            'version',
            apiInfo.draft_version ?? null,
        );
        await this.#draftDataStore.setState(
            id,
            'status', // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (apiInfo.draft_status ?? null) as ScriptEnums.Status | null,
        );

        if (scriptInfo) {
            await this.#scriptDataStore.upsert(rawInfo);
        }

        return info;
    }
    //#endregion

    //#region create api info
    #createApiScriptInput(
        draftInfo: ScriptTypes.FrozenDraftInfo,
    ): ApiTypes.Protocol.ScriptInputEntity {
        return {
            title: draftInfo.state.title,

            story: draftInfo.state.storyDesc,

            story_types: draftInfo.state.kinds?.map(item => item.label) ?? [],

            opening_story: draftInfo.state.openingDesc,

            story_flow: draftInfo.state.branches?.filter(
                item => !StringUtils.isEmpty(item.trim()),
            ),

            role_arrangement_type: draftInfo.state.fullyCustomRole
                ? ScriptEnums.ApiRoleArrangement.LetPlayer
                : ScriptEnums.ApiRoleArrangement.LetMe,

            fixed_roles: draftInfo.state.fullyCustomRole
                ? []
                : (draftInfo.state.roles
                      ?.filter(item => !item.isNpc && !item.isOpen)
                      .map(item => this.createApiRole(item)) ?? []),

            tbd_roles: draftInfo.state.fullyCustomRole
                ? []
                : (draftInfo.state.roles
                      ?.filter(item => item.isOpen)
                      .map(item => this.createApiRole(item)) ?? []),
            npc_roles:
                draftInfo.state.roles
                    ?.filter(item => item.isNpc)
                    .map(item => this.createApiRole(item)) ?? [],
        };
    }
    //#endregion

    protected override getInitialInternalState(): InternalState {
        return {
            defaultConfig: null,
            waitNarrativeLoadingTextList: [],
        };
    }

    //#region 工具
    public readonly createApiRole = (
        item: ScriptTypes.RoleInfo,
    ): ApiTypes.Protocol.ScriptRole => ({
        role_id: item.id,
        identities: item.state.identities.map(one => one.label),
        background: item.state.backgroundDesc,
        extra_background: item.state.supplementBackgroundDesc ?? undefined,
        secret: item.state.secret,
        character_info:
            item.state.characterId == null
                ? undefined
                : {
                      character_id: item.state.characterId,
                      create_source: 'character', // TODO 这个字段是没用的
                      outfit_id:
                          item.state.characterInfo?.state.currentFigureSkinId ??
                          undefined,
                  },
    });

    public readonly getRecSceneKey = (
        options: LibTypes.FrozenDefine<{
            kind: ApiTypes.Protocol.RecFeedScriptsReq['source'],
            tag?: ApiTypes.Protocol.FeedSceneTag | null,
            characterId?: string | null,
        }>,
    ) => {
        const { kind, tag, characterId } = options;
        const sceneKey = `${kind}${tag == null ? '' : `-${tag.index}`}${characterId == null ? '' : `-${characterId}`}`;

        return sceneKey;
    };
    //#endregion

    //#region create new
    public readonly createNewDraft = () => {
        const userInfo = this.#userController.state.loggedInUser;

        const id = `${this.#scriptId--}`;

        const attrs: ScriptTypes.InitialScriptAttrs = {
            dramatizeInfo: {
                openingId: null,
                activePlayid: null,
                activeRoleId: null,
            },
            version: null,
            impressionId: null,

            draftInfo: null,
        };

        const state: ScriptTypes.InitialScriptState = {
            title: '',
            storyDesc: '',
            openingDesc: '',

            isCollected: false,
            label: '',
            labelKind: null,

            roles: null,
            branches: null,

            kinds: [],
            tags: [],

            author:
                (userInfo && {
                    id: userInfo.id,
                    name: userInfo.state.nickname,
                    isPlatform: false,
                }) ??
                null,

            sceneInfoRecord: {},

            publishTime: null,
            updateTime: Date.now(),
            favouriteTime: null,
            lastPlayTime: null,

            preparePlayBackgroundImage: null,
        };

        const scriptInfo = this.#scriptDataStore.create(
            this.#createRawScript(id, true, attrs, state),
        );

        const draftInfo = this.#createNewDraft(scriptInfo);
        this.#scriptDataStore.setAttrSync(id, 'draftInfo', draftInfo);

        return draftInfo;
    };

    public readonly createNewRole = (
        options: LibTypes.Define<{ isOpen: boolean, isNpc: boolean }>,
    ) => {
        const { isOpen, isNpc } = options;

        const info: ScriptTypes.RoleInfo = {
            id: `${this.#roleId--}`,
            isLocal: true,

            isOpen,
            isNpc,

            state: this.#createRoleState({
                identities: [this.createNewIdentity()],

                backgroundDesc: '',

                supplementBackgroundDesc: '',

                secret: '',
                roleGoal: '',
                characterId: null,
            }),
        };

        return this.#roleDataStore.create(info);
    };

    public readonly cloneNewRole = (role: ScriptTypes.FrozenRoleInfo) =>
        this.#roleDataStore.create({
            id: `${this.#roleId--}`,
            isLocal: true,
            isOpen: role.isOpen,
            isNpc: role.isNpc,
            state: this.#createRoleState(cloneDeep(role.state)),
        });

    public readonly createNewIdentity = (
        label = '',
        isRemote = false,
    ): ScriptTypes.Identity => ({
        id: `${this.#identityId--}`,
        label,
        isRemote,
    });
    //#endregion

    //#region request
    public readonly requestDefaultConfig = async () => {
        if (this.internal.defaultConfig) {
            return this.internal.defaultConfig;
        }

        const [tagsRes, searchHintRes, kindsRes] =
            await this.#requestDefaultConfigTask();

        this.internal.defaultConfig = {
            kindList: kindsRes.types.map(item => ({
                id: item,
                label: item,
            })),
            feedTagList: tagsRes.tags.map(item => ({
                index: item.index,
                name: item.tag_name,
            })),
            feedSearchHint: searchHintRes.text,
        };

        return this.internal.defaultConfig;
    };

    public readonly requestRecList = async (
        options: LibTypes.FrozenDefine<{
            kind: ApiTypes.Protocol.RecFeedScriptsReq['source'],
            tag?: ApiTypes.Protocol.FeedSceneTag | null,
            characterId?: string | null,
        }>,
    ) => {
        const { kind, tag, characterId } = options;
        const res = await this.#apiService.call.feed.rec_scripts({
            source: kind,
            limit: Settings.limit,
            world_filter: (tag && { tag }) ?? undefined,
            play_with_filter:
                characterId == null ? undefined : { character_id: characterId },
        });

        const sceneKey = this.getRecSceneKey(options);

        const ids = await Promise.all(
            res.list.map(async item => {
                const data = await this.#upsertScriptFromApiInfo(
                    item,
                    sceneKey,
                );
                return data.id;
            }),
        );

        return ids;
    };

    public readonly requestSearchList = async (
        options: LibTypes.FrozenDefine<{
            keyword: string,
            nextCursor?: string | null,
            limit?: number,
        }>,
    ) => {
        const res = await this.#apiService.call.feed.search_scripts({
            keyword: options.keyword,
            next_cursor: options.nextCursor ?? undefined,
            limit: Settings.limit,
        });
        const ids = await Promise.all(
            res.list.map(async item => {
                const data = await this.#upsertScriptFromApiInfo(
                    item,
                    ScriptEnums.SceneKindKey.Search,
                );
                return data.id;
            }),
        );

        return {
            ids,
            nextCursor: res.next_cursor,
            hasMore: res.has_more,
        };
    };

    public readonly requestMyList = async (nextCursor: string | null) => {
        const res = await this.#apiService.call.user.get_user_scripts({
            status: 'published',
            cursor: nextCursor ?? undefined,
            limit: Settings.limit,
        });
        const ids = await Promise.all(
            res.list.map(async item => {
                const data = await this.#upsertScriptFromApiInfo(
                    item,
                    ScriptEnums.SceneKindKey.Published,
                );
                return data.id;
            }),
        );

        return {
            ids,
            nextCursor: res.next_cursor,
            hasMore: res.has_more,
        };
    };

    public readonly requestMyDraftList = async (nextCursor: string | null) => {
        const res = await this.#apiService.call.user.get_user_scripts({
            status: 'draft',
            cursor: nextCursor ?? undefined,
            limit: Settings.limit,
        });
        const ids = await Promise.all(
            res.list.map(async item => {
                const data = await this.#upsertDraftFromApiInfo(item);

                return data.id;
            }),
        );

        return {
            ids,
            nextCursor: res.next_cursor,
            hasMore: res.has_more,
        };
    };

    public readonly requestMyCollectList = async (
        nextCursor: string | null,
    ) => {
        const res = await this.#apiService.call.user.list_favourite_scripts({
            cursor: nextCursor ?? undefined,
            limit: Settings.limit,
        });
        const ids = await Promise.all(
            res.scripts.map(async item => {
                const data = await this.#upsertScriptFromApiInfo(
                    item,
                    ScriptEnums.SceneKindKey.Collect,
                );

                return data.id;
            }),
        );

        return {
            ids,
            nextCursor: res.next_cursor,
            hasMore: !!res.has_more,
        };
    };

    public readonly requestPlayDetails = async (id: string) => {
        const res = await this.#apiService.call.play.script_detail({
            script_id: id,
        });

        return this.#upsertScriptFromApiInfo(res, null);
    };

    public readonly requestDetails = async (id: string) => {
        const res = await this.#apiService.call.script.detail({
            script_id: id,
        });

        return this.#upsertScriptFromApiInfo(res, null);
    };

    public readonly requestDraftDetails = async (
        id: string,
        version: string,
    ) => {
        const res = await this.#apiService.call.script.detail({
            script_id: id,
            version,
        });

        if (res.status === 'published') {
            return null;
        }

        return this.#upsertDraftFromApiInfo(res);
    };

    public readonly requestDeleteDraft = async (
        id: string,
        version: string,
        updateLocalStats = true,
    ) => {
        await this.#apiService.call.script.delete_draft({
            script_id: id,
            version,
        });
        await this.#draftDataStore.delete(id);

        updateLocalStats &&
            this.#userController.setMyScriptStats(prevValue => ({
                draftCount: prevValue.draftCount - 1,
            }));
    };

    public readonly requestCreateDraft = async (
        data: ScriptTypes.FrozenDraftInfo,
    ) => {
        const res = await this.#apiService.call.script.create({
            script_info: this.#createApiScriptInput(data),
        });

        const scriptRes = await this.#apiService.call.script.detail({
            script_id: res.script_id,
            version: res.version,
        });

        await this.#upsertScriptFromApiInfo(scriptRes, null);

        this.#userController.setMyScriptStats(prevValue => ({
            draftCount: prevValue.draftCount + 1,
        }));
        return res;
    };

    public readonly requestPublishScript = async (
        data: ScriptTypes.FrozenDraftInfo,
    ) => {
        const res = await this.requestUpdateDraft(data);
        const scriptId = res.script_id;
        const version = res.version;
        await this.#apiService.call.script.publish({
            script_id: scriptId,
            version,
        });

        await this.setDraftState(
            scriptId,
            'status',
            ScriptEnums.Status.Publishing,
        );
    };

    public readonly requestCreateDraftByScript = async (scriptId: string) => {
        const scriptInfo = this.#scriptDataStore.get(scriptId);
        if (scriptInfo) {
            if (
                scriptInfo.draftInfo?.version != null &&
                (scriptInfo.draftInfo.state.status ===
                    ScriptEnums.Status.Draft ||
                    scriptInfo.draftInfo.state.status ===
                        ScriptEnums.Status.Rejected)
            ) {
                await this.requestDeleteDraft(
                    scriptId,
                    scriptInfo.draftInfo.version,
                    false,
                );
            }

            const res = await this.#apiService.call.script.detail({
                script_id: scriptId,
            });
            const info = await this.#upsertDraftFromApiInfo({
                ...res,
                draft_status: 'draft',
            });

            const updateRes = await this.#apiService.call.script.update({
                script_id: scriptId,
                script_info: this.#createApiScriptInput(info),
                version: res.version,
            });

            await this.#draftDataStore.setAttr(
                scriptId,
                'version',
                updateRes.version,
            );

            return info;
        }

        return null;
    };

    public readonly requestUpdateDraft = async (
        data: ScriptTypes.FrozenDraftInfo,
    ) => {
        let id = data.id;
        const draftInfo = this.#draftDataStore.get(id);
        let version = data.version ?? '';
        if (draftInfo?.isLocal) {
            const res = await this.requestCreateDraft(data);
            id = res.script_id;
            version = res.version;
        }

        const result = await this.#apiService.call.script.update({
            script_id: id,
            script_info: this.#createApiScriptInput(data),
            version,
        });

        await this.setScriptState(id, 'updateTime', Date.now());

        return result;
    };
    //#endregion
}
