// import { set } from 'lodash';

// import { BaseZoneController, zoneController } from '$/core';
// import { ScriptEnums } from '$/enums';
// import { ApiService, FileService } from '$/services';
// import type { ApiTypes, ScriptTypes } from '$/types';
// import { FileUtils, ObjectUtils, StringUtils, TaskUtils } from '$/utils';

// import { CharacterController } from '../character/character-controller';
// import { UserController } from '../user/user-controller';

// import { Settings } from './script-const';

// type InternalState = LibTypes.VarDefine<{
//     scriptRecord: ScriptTypes.ScriptInfoRecord,
//     setupScriptRecord: ScriptTypes.SetupScriptInfoRecord,
//     defaultConfig: ScriptTypes.DefaultConfig | null,
// }>;

// type State = LibTypes.FrozenPick<
//     InternalState,
//     'defaultConfig' | 'scriptRecord' | 'setupScriptRecord'
// >;

// @zoneController()
// export class ScriptController extends BaseZoneController<State, InternalState> {
//     public constructor(
//         apiService: ApiService,
//         characterController: CharacterController,
//         userController: UserController,
//         fileService: FileService,
//     ) {
//         super();
//         this.#apiService = apiService;
//         this.#characterController = characterController;
//         this.#userController = userController;
//         this.#fileService = fileService;

//         this.#watch();
//     }

//     readonly #apiService;
//     readonly #characterController;
//     readonly #userController;
//     readonly #fileService;

//     #id = -1;
//     #roleId = -1;
//     #platformUserId = -1;
//     #identityId = -1;

//     readonly #requestDefaultConfigTask = TaskUtils.createMergeTask(async () =>
//         Promise.all([
//             this.#apiService.call.feed.tags(),
//             this.#apiService.call.feed.get_search_hint(),
//             this.#apiService.call.script.list_script_types(),
//         ]));

//     #watch() {
//         this.watch(
//             () => this.#userController.state.loggedInUser,
//             () => {
//                 this.requestDefaultConfig();
//             },
//             {
//                 immediate: true,
//             },
//         );
//     }

//     #bindGetter<
//         T extends
//             | ScriptTypes.InitialScriptInfo
//             | ScriptTypes.InitialSetupScriptInfo,
//     >(info: T) {
//         const $this = this;
//         // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
//         const result = {
//             ...info,
//             get isOwner() {
//                 return (
//                     this.author?.id ===
//                     $this.#userController.state.loggedInUser?.id
//                 );
//             },
//         } as ScriptTypes.SetupScriptInfo;

//         // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
//         return result as T extends ScriptTypes.InitialScriptInfo
//             ? ScriptTypes.ScriptInfo
//             : ScriptTypes.SetupScriptInfo;
//     }

//     #upsert(info: ScriptTypes.InitialScriptInfo) {
//         const id = info.id;

//         if (!this.internal.scriptRecord[id]) {
//             this.internal.scriptRecord[id] = this.#bindGetter(info);
//         } else {
//             ObjectUtils.safeAssignExcludeUndefined(
//                 this.internal.scriptRecord[id],
//                 info,
//             );
//         }

//         return this.internal.scriptRecord[id];
//     }

//     #updateDraftInfoFromApiInfo(
//         id: string,
//         apiInfo: Partial<
//             ApiTypes.Protocol.ScriptEntity & ApiTypes.Protocol.ScriptInputEntity
//         >,
//     ) {
//         const info =
//             this.internal.scriptRecord[id] ??
//             this.internal.setupScriptRecord[id];
//         if (info) {
//             const draftInfo = info.draftInfo;

//             const roles =
//                 apiInfo.fixed_roles || apiInfo.tbd_roles || apiInfo.npc_roles
//                     ? [
//                           ...(apiInfo.fixed_roles?.map(item =>
//                               this.#createRoleFromApiInfo(item, false)) ?? []),
//                           ...(apiInfo.tbd_roles?.map(item =>
//                               this.#createRoleFromApiInfo(item, false)) ?? []),
//                           ...(apiInfo.npc_roles?.map(item =>
//                               this.#createRoleFromApiInfo(item, true)) ?? []),
//                       ]
//                     : null;

//             info.draftInfo = {
//                 scriptId: info.id,
//                 title: apiInfo.title ?? draftInfo.title,
//                 fullyCustomRole:
//                     apiInfo.role_arrangement_type == null
//                         ? draftInfo.fullyCustomRole
//                         : apiInfo.role_arrangement_type === 2,
//                 desc: apiInfo.story ?? draftInfo.desc, // TODO
//                 kinds:
//                     apiInfo.story_types?.map(item => ({
//                         id: item,
//                         label: item,
//                     })) ?? draftInfo.kinds,
//                 openingDesc: apiInfo.opening_story ?? draftInfo.openingDesc,
//                 roles: roles ?? draftInfo.roles,
//                 version: apiInfo.version ?? draftInfo.version,
//                 branches: apiInfo.story_flow ?? [],
//                 status:
//                     // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
//                     (apiInfo.status as ScriptEnums.Status | undefined) ??
//                     draftInfo.status,
//             };
//         }

//         return null;
//     }

//     #createRoleFromApiInfo(
//         apiRole: ApiTypes.Protocol.ScriptRole,
//         isNpc: boolean,
//     ): ScriptTypes.Role {
//         const characterApiInfo = apiRole.character_info;
//         if (characterApiInfo?.character_id != null) {
//             const data = this.#characterController.upsertFormApiInfo({
//                 character_id: characterApiInfo.character_id,
//                 name: characterApiInfo.name,
//                 aka: characterApiInfo.aka,
//                 current_outfit_id: characterApiInfo.outfit_id,
//             });

//             characterApiInfo.image &&
//                 this.#characterController.updateDefaultFigureSkinByApiMedia(
//                     data.id,
//                     characterApiInfo.image,
//                     characterApiInfo.bkg_main_color,
//                 );
//         }

//         const $this = this;
//         return {
//             roleId: apiRole.role_id ?? '',
//             isSetup: false,
//             isOpen: !apiRole.character_info,
//             isNpc,
//             identities: apiRole.identities.map(item =>
//                 this.createNewIdentity(item, true)),
//             background: apiRole.background ?? '',
//             secret: apiRole.secret ?? '',
//             roleGoal: apiRole.goal ?? '',
//             characterId: apiRole.character_info?.character_id ?? null,
//             get characterInfo() {
//                 if (this.characterId == null) {
//                     return null;
//                 }

//                 return (
//                     $this.#characterController.state.characterRecord[
//                         this.characterId
//                     ] ?? null
//                 );
//             },
//         };
//     }

//     #createNewFromApiInfo(
//         apiScript: LibTypes.SetRequired<
//             Partial<
//                 ApiTypes.Protocol.ScriptDetailResp &
//                     ApiTypes.Protocol.ScriptEntity
//             >,
//             'script_id'
//         >,
//         sceneKey: string | null,
//     ): ScriptTypes.ScriptInfo {
//         const oldInfo = this.internal.scriptRecord[apiScript.script_id];
//         const roles =
//             apiScript.fixed_roles || apiScript.tbd_roles || apiScript.npc_roles
//                 ? [
//                       ...(apiScript.fixed_roles?.map(item =>
//                           this.#createRoleFromApiInfo(item, false)) ?? []),
//                       ...(apiScript.tbd_roles?.map(item =>
//                           this.#createRoleFromApiInfo(item, false)) ?? []),
//                       ...(apiScript.npc_roles?.map(item =>
//                           this.#createRoleFromApiInfo(item, true)) ?? []),
//                   ]
//                 : null;

//         const sceneInfo: ScriptTypes.SceneInfo | null =
//             sceneKey == null
//                 ? null
//                 : {
//                       cover: apiScript.bkg_media
//                           ? this.#fileService.createImageResource(
//                                 apiScript.bkg_media.id,
//                                 FileUtils.getImageInfoFromApiInfo(
//                                     apiScript.bkg_media,
//                                 ),
//                             )
//                           : (oldInfo?.sceneInfoRecord[sceneKey]?.cover ?? null),
//                       coverRoles:
//                           apiScript.appearance_medias?.map(item =>
//                               this.#fileService.createImageResource(
//                                   item.id,
//                                   FileUtils.getImageInfoFromApiInfo(item),
//                               )) ??
//                           oldInfo?.sceneInfoRecord[sceneKey]?.coverRoles ??
//                           [],
//                   };

//         const info: ScriptTypes.InitialScriptInfo = {
//             id: apiScript.script_id,
//             isInitializing: false,

//             title: apiScript.title ?? oldInfo?.title ?? '',
//             desc: '', // TODO

//             openingDesc: '',
//             roles: roles ?? oldInfo?.roles ?? [],
//             branches: [],
//             kinds: [],

//             tags:
//                 apiScript.tags?.map(item => ({ id: item, label: item })) ??
//                 oldInfo?.tags ??
//                 [],
//             contentInfo: {
//                 endText: '',
//             },
//             sceneInfoRecord: {
//                 ...oldInfo?.sceneInfoRecord,
//                 ...(sceneKey == null
//                     ? null
//                     : {
//                           [sceneKey]: sceneInfo,
//                       }),
//             },
//             bgColor: apiScript.bkg_main_color ?? oldInfo?.bgColor ?? null,

//             interaction: {
//                 isCollected: !!(
//                     apiScript.is_favourite ?? oldInfo?.interaction.isCollected
//                 ),
//             },
//             metrics: {
//                 collectedCount: 0,
//             },
//             recommendInfo: {
//                 hotMsg:
//                     apiScript.corner_tag ?? oldInfo?.recommendInfo.hotMsg ?? '',
//                 impressionId:
//                     apiScript.impression_id ??
//                     oldInfo?.recommendInfo.impressionId ??
//                     null,
//             },
//             author: apiScript.author
//                 ? {
//                       id: apiScript.author.is_platform
//                           ? `${this.#platformUserId--}`
//                           : apiScript.author.uid,
//                       name: apiScript.author.user_name,
//                   }
//                 : (oldInfo?.author ?? null),
//             dramatizeInfo: {
//                 openingId:
//                     apiScript.script_opening_id ??
//                     oldInfo?.dramatizeInfo.openingId ??
//                     null,
//                 activePlayid:
//                     apiScript.active_play_id ??
//                     oldInfo?.dramatizeInfo.activePlayid ??
//                     null,
//                 activeRoleId:
//                     apiScript.active_play_role_id ??
//                     oldInfo?.dramatizeInfo.activeRoleId ??
//                     null,
//             },

//             version: apiScript.version ?? oldInfo?.version ?? null,

//             draftInfo: oldInfo?.draftInfo ?? {
//                 scriptId: apiScript.script_id,
//             },

//             dateInfo: {
//                 publishTime:
//                     apiScript.publish_time ?? oldInfo?.dateInfo.publishTime,
//                 updateTime:
//                     apiScript.update_time ?? oldInfo?.dateInfo.updateTime,
//                 favouriteTime:
//                     apiScript.favourite_time ?? oldInfo?.dateInfo.favouriteTime,
//                 lastPlayTime:
//                     apiScript.last_play_time ?? oldInfo?.dateInfo.lastPlayTime,
//             },
//         };

//         return this.#bindGetter(info);
//     }

//     protected override getInitialInternalState(): InternalState {
//         return {
//             scriptRecord: {},
//             setupScriptRecord: {},
//             defaultConfig: null,
//         };
//     }

//     public readonly upsert = (
//         params:
//             | LibTypes.Arr<ScriptTypes.InitialScriptInfo>
//             | ScriptTypes.InitialScriptInfo,
//     ) => {
//         const list = params instanceof Array ? params : [params];

//         list.forEach(item => this.#upsert(item));
//     };

//     public readonly update = <
//         K extends LibTypes.WritableKeysDeepOf<ScriptTypes.InitialScriptInfo>,
//     >(
//         id: ScriptTypes.ScriptId,
//         keyPath: K,
//         value: LibTypes.Get<ScriptTypes.InitialScriptInfo, K>,
//     ) => {
//         const data =
//             this.internal.scriptRecord[id] ??
//             this.internal.setupScriptRecord[id];

//         if (data) {
//             set(data, keyPath, value);
//         }
//     };

//     public readonly createApiRole = (
//         item: ScriptTypes.Role,
//     ): ApiTypes.Protocol.ScriptRole => ({
//         role_id: item.roleId,
//         identities: item.identities.map(one => one.label),
//         background: item.background,
//         extra_background: item.supplementBackground,
//         secret: item.secret,
//         character_info:
//             item.characterId == null
//                 ? undefined
//                 : {
//                       character_id: item.characterId,
//                       create_source: 'character', // TODO 这个字段是没用的
//                       outfit_id:
//                           item.characterInfo?.currentFigureSkinId ?? undefined,
//                   },
//     });

//     public readonly createApiScriptInput = (
//         data: ScriptTypes.StateDraftInfo,
//     ): ApiTypes.Protocol.ScriptInputEntity => ({
//         title: data.title ?? '',
//         role_arrangement_type: data.fullyCustomRole ? 2 : 1,
//         story: data.desc ?? '',
//         story_types: data.kinds?.map(item => item.label) ?? [],
//         opening_story: data.openingDesc,
//         story_flow: data.branches?.filter(
//             item => !StringUtils.isEmpty(item.trim()),
//         ),
//         fixed_roles: data.fullyCustomRole
//             ? []
//             : (data.roles
//                   ?.filter(item => !item.isNpc && !item.isOpen)
//                   .map(this.createApiRole) ?? []),
//         tbd_roles: data.fullyCustomRole
//             ? []
//             : (data.roles
//                   ?.filter(item => item.isOpen)
//                   .map(this.createApiRole) ?? []),
//         npc_roles:
//             data.roles?.filter(item => item.isNpc).map(this.createApiRole) ??
//             [],
//     });

//     public readonly requestRecList = async (
//         options: LibTypes.FrozenDefine<{
//             kind: ApiTypes.Protocol.RecFeedScriptsReq['source'],
//             tag?: ApiTypes.Protocol.FeedSceneTag | null,
//             characterId?: string | null,
//         }>,
//     ) => {
//         const { kind, tag, characterId } = options;
//         const res = await this.#apiService.call.feed.rec_scripts({
//             source: kind,
//             limit: Settings.limit,
//             world_filter: (tag && { tag }) ?? undefined,
//             play_with_filter:
//                 characterId == null ? undefined : { character_id: characterId },
//         });

//         const sceneKey = this.getRecSceneKey(options);

//         const ids = res.list.map(item => {
//             const data = this.#upsert(
//                 this.#createNewFromApiInfo(item, sceneKey),
//             );
//             return data.id;
//         });

//         return ids;
//     };

//     public readonly getRecSceneKey = (
//         options: LibTypes.FrozenDefine<{
//             kind: ApiTypes.Protocol.RecFeedScriptsReq['source'],
//             tag?: ApiTypes.Protocol.FeedSceneTag | null,
//             characterId?: string | null,
//         }>,
//     ) => {
//         const { kind, tag, characterId } = options;
//         const sceneKey = `${kind}${tag == null ? '' : `-${tag.index}`}${characterId == null ? '' : `-${characterId}`}`;

//         return sceneKey;
//     };

//     public readonly requestSearchList = async (
//         options: LibTypes.FrozenDefine<{
//             keyword: string,
//             nextCursor?: string | null,
//             limit?: number,
//         }>,
//     ) => {
//         const res = await this.#apiService.call.feed.search_scripts({
//             keyword: options.keyword,
//             next_cursor: options.nextCursor ?? undefined,
//             limit: Settings.limit,
//         });
//         const ids = res.list.map(item => {
//             const data = this.#upsert(
//                 this.#createNewFromApiInfo(
//                     item,
//                     ScriptEnums.SceneKindKey.Search,
//                 ),
//             );
//             return data.id;
//         });

//         return {
//             ids,
//             nextCursor: res.next_cursor,
//             hasMore: res.has_more,
//         };
//     };

//     public readonly requestMyList = async (nextCursor: string | null) => {
//         const res = await this.#apiService.call.user.get_user_scripts({
//             status: 'published',
//             cursor: nextCursor ?? undefined,
//             limit: Settings.limit,
//         });
//         const ids = res.list.map(item => {
//             const data = this.#upsert(
//                 this.#createNewFromApiInfo(
//                     item,
//                     ScriptEnums.SceneKindKey.Published,
//                 ),
//             );
//             this.#updateDraftInfoFromApiInfo(item.script_id, {
//                 status: item.draft_status,
//                 version: item.draft_version,
//             });
//             return data.id;
//         });

//         return {
//             ids,
//             nextCursor: res.next_cursor,
//             hasMore: res.has_more,
//         };
//     };

//     public readonly requestMyDraftList = async (nextCursor: string | null) => {
//         const res = await this.#apiService.call.user.get_user_scripts({
//             status: 'draft',
//             cursor: nextCursor ?? undefined,
//             limit: Settings.limit,
//         });
//         const ids = res.list.map(item => {
//             const data = this.#upsert(
//                 this.#createNewFromApiInfo(
//                     {
//                         script_id: item.script_id,
//                         update_time: item.update_time,
//                     },
//                     null,
//                 ),
//             );

//             this.#updateDraftInfoFromApiInfo(item.script_id, item);
//             return data.id;
//         });

//         return {
//             ids,
//             nextCursor: res.next_cursor,
//             hasMore: res.has_more,
//         };
//     };

//     public readonly requestMyCollectList = async (
//         nextCursor: string | null,
//     ) => {
//         const res = await this.#apiService.call.user.list_favourite_scripts({
//             cursor: nextCursor ?? undefined,
//             limit: Settings.limit,
//         });
//         const ids = res.scripts.map(item => {
//             const data = this.#upsert(
//                 this.#createNewFromApiInfo(
//                     item,
//                     ScriptEnums.SceneKindKey.Collect,
//                 ),
//             );
//             return data.id;
//         });

//         return {
//             ids,
//             nextCursor: res.next_cursor,
//             hasMore: !!res.has_more,
//         };
//     };

//     public readonly createSetupNew = (): ScriptTypes.SetupScriptInfo => {
//         const id = (this.#id--).toString();

//         const info = this.#bindGetter({
//             id,
//             isInitializing: true,
//             isSetup: true,
//             draftInfo: { scriptId: id },
//         });
//         this.internal.setupScriptRecord[info.id] = info;
//         return info;
//     };

//     public readonly createNewRole = (
//         options: LibTypes.FrozenDefine<{ isOpen: boolean, isNpc: boolean }>,
//     ): ScriptTypes.Role => {
//         const { isOpen, isNpc } = options;

//         const $this = this;

//         const info: ScriptTypes.Role = {
//             // roleId: string,
//             // isOpen?: boolean,
//             // background: string,
//             // supplementBackground?: string,
//             // secret?: string,
//             // identities: LibTypes.Arr<string>,
//             // roleGoal?: string,
//             // characterId?: string | null,
//             // get characterInfo(): CharacterTypes.StateCharacterInfo | null,
//             roleId: `${this.#roleId--}`,
//             isSetup: true,
//             isOpen,
//             isNpc,
//             background: '',
//             supplementBackground: '',
//             secret: '',
//             identities: [this.createNewIdentity()],
//             roleGoal: '',
//             characterId: null,
//             get characterInfo() {
//                 if (this.characterId == null) {
//                     return null;
//                 }

//                 return (
//                     $this.#characterController.state.characterRecord[
//                         this.characterId
//                     ] ?? null
//                 );
//             },
//         };

//         return info;
//     };

//     public readonly updateRoleInfo = <
//         K extends LibTypes.WritableKeysDeepOf<ScriptTypes.Role>,
//     >(
//         scriptInfo: ScriptTypes.StateMaySetupScriptInfo,
//         roleId: string,
//         keyPath: K,
//         value: LibTypes.Get<ScriptTypes.Role, K>,
//     ) => {
//         const item = scriptInfo.roles?.find(one => one.roleId === roleId);
//         if (item) {
//             set(item, keyPath, value);
//         }
//     };

//     public readonly updateDraftInfo = <
//         K extends LibTypes.WritableKeysDeepOf<ScriptTypes.DraftInfo>,
//     >(
//         scriptId: ScriptTypes.ScriptId,
//         keyPath: K,
//         value: LibTypes.Get<ScriptTypes.DraftInfo, K>,
//     ) => {
//         const scriptInfo =
//             this.internal.scriptRecord[scriptId] ??
//             this.internal.setupScriptRecord[scriptId];
//         if (scriptInfo) {
//             set(scriptInfo.draftInfo, keyPath, value);
//         }
//     };

//     public readonly updateDraftRoleInfo = <
//         K extends LibTypes.WritableKeysDeepOf<ScriptTypes.Role>,
//     >(
//         scriptId: ScriptTypes.ScriptId,
//         roleId: string,
//         keyPath: K,
//         value: LibTypes.Get<ScriptTypes.Role, K>,
//     ) => {
//         const scriptInfo =
//             this.internal.scriptRecord[scriptId] ??
//             this.internal.setupScriptRecord[scriptId];
//         if (scriptInfo) {
//             const item = scriptInfo.draftInfo.roles?.find(
//                 one => one.roleId === roleId,
//             );
//             if (item) {
//                 set(item, keyPath, value);
//             }
//         }
//     };

//     public readonly requestPlayDetails = async (id: string) => {
//         const res = await this.#apiService.call.play.script_detail({
//             script_id: id,
//         });

//         return this.#upsert(this.#createNewFromApiInfo(res, null));
//     };

//     public readonly requestDetails = async (id: string) => {
//         const res = await this.#apiService.call.script.detail({
//             script_id: id,
//         });

//         return this.#upsert(this.#createNewFromApiInfo(res, null));
//     };

//     public readonly requestDraftDetails = async (
//         id: string,
//         version: string,
//     ) => {
//         const res = await this.#apiService.call.script.detail({
//             script_id: id,
//             version,
//         });

//         if (res.status === 'published') {
//             return null;
//         }

//         const info = this.#upsert(
//             this.#createNewFromApiInfo({ script_id: res.script_id }, null),
//         );
//         this.#updateDraftInfoFromApiInfo(res.script_id, res);

//         return info;
//     };

//     public readonly requestDeleteDraft = async (
//         id: string,
//         version: string,
//         updateLocalStats = true,
//     ) => {
//         await this.#apiService.call.script.delete_draft({
//             script_id: id,
//             version,
//         });
//         this.update(id, 'draftInfo', { scriptId: id });

//         updateLocalStats &&
//             this.#userController.updateNow(
//                 'scriptStats.local.draftCount',
//                 prevValue => prevValue - 1,
//             );
//     };

//     public readonly requestCreateScript = async (
//         data: ScriptTypes.StateDraftInfo,
//     ) => {
//         const res = await this.#apiService.call.script.create({
//             script_info: this.createApiScriptInput(data),
//         });
//         this.#userController.updateNow(
//             'scriptStats.local.draftCount',
//             prevValue => prevValue + 1,
//         );
//         return res;
//     };

//     public readonly requestPublishScript = async (
//         data: ScriptTypes.StateDraftInfo,
//     ) => {
//         const res = await this.requestUpdateScript(data);
//         const scriptId = res.script_id;
//         const version = res.version;
//         await this.#apiService.call.script.publish({
//             script_id: scriptId,
//             version,
//         });

//         this.updateDraftInfo(scriptId, 'status', ScriptEnums.Status.Publishing);
//     };

//     public readonly requestCreateDraftByScript = async (scriptId: string) => {
//         const scriptInfo = this.internal.scriptRecord[scriptId];
//         if (scriptInfo) {
//             if (
//                 scriptInfo.draftInfo.version != null &&
//                 (scriptInfo.draftInfo.status === ScriptEnums.Status.Draft ||
//                     scriptInfo.draftInfo.status === ScriptEnums.Status.Rejected)
//             ) {
//                 await this.requestDeleteDraft(
//                     scriptId,
//                     scriptInfo.draftInfo.version,
//                     false,
//                 );
//             }

//             const res = await this.#apiService.call.script.detail({
//                 script_id: scriptId,
//             });
//             const info = this.#upsert(this.#createNewFromApiInfo(res, null));
//             this.#updateDraftInfoFromApiInfo(scriptId, {
//                 ...res,
//                 status: 'draft',
//             });
//             const updateRes = await this.#apiService.call.script.update({
//                 script_id: scriptId,
//                 script_info: this.createApiScriptInput(info.draftInfo),
//                 version: info.version ?? '',
//             });

//             this.#updateDraftInfoFromApiInfo(scriptId, {
//                 version: updateRes.version,
//             });

//             return info;
//         }

//         return null;
//     };

//     public readonly requestUpdateScript = async (
//         data: ScriptTypes.StateDraftInfo,
//     ) => {
//         let scriptId = data.scriptId;
//         const scriptInfo = this.internal.setupScriptRecord[scriptId];
//         let version = data.version ?? '';
//         if (scriptInfo) {
//             const res = await this.requestCreateScript(data);
//             scriptId = res.script_id;
//             version = res.version;
//         }

//         const result = await this.#apiService.call.script.update({
//             script_id: scriptId,
//             script_info: this.createApiScriptInput(data),
//             version,
//         });

//         this.update(scriptId, 'dateInfo.updateTime', Date.now());

//         return result;
//     };

//     public readonly requestDefaultConfig = async () => {
//         if (this.internal.defaultConfig) {
//             return this.internal.defaultConfig;
//         }

//         const [tagsRes, searchHintRes, kindsRes] =
//             await this.#requestDefaultConfigTask();

//         this.internal.defaultConfig = {
//             kindList: kindsRes.types.map(item => ({
//                 id: item,
//                 label: item,
//             })),
//             feedTagList: tagsRes.tags.map(item => ({
//                 index: item.index,
//                 name: item.tag_name,
//             })),
//             feedSearchHint: searchHintRes.text,
//         };

//         return this.internal.defaultConfig;
//     };

//     public readonly createNewIdentity = (
//         label = '',
//         isRemote = false,
//     ): ScriptTypes.Identity => ({
//         id: `${this.#identityId--}`,
//         label,
//         isRemote,
//     });
// }
