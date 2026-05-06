// import { cloneDeep, set } from 'lodash';

// import { BaseZoneController, zoneController } from '$/core';
// import { CharacterEnums } from '$/enums';
// import { ApiService, FileService } from '$/services';
// import type { ApiTypes, CharacterTypes, FileTypes } from '$/types';
// import {
//     ArrayUtils,
//     FileUtils,
//     ObjectUtils,
//     StringUtils,
//     TaskUtils,
// } from '$/utils';

// import { AppController } from '../app/app-controller';
// import { UserController } from '../user/user-controller';

// import { Settings } from './character-const';

// type InternalState = LibTypes.VarDefine<{
//     characterRecord: CharacterTypes.CharacterInfoRecord,
//     setupCharacterRecord: CharacterTypes.SetupCharacterInfoRecord,
//     defaultConfig: CharacterTypes.DefaultConfig | null,
//     otherSpeciesList: LibTypes.Arr<CharacterTypes.Species>,
//     menuCustomSpeciesList: LibTypes.Arr<CharacterTypes.Species>,
// }>;

// type State = LibTypes.FrozenPick<
//     InternalState,
//     | 'characterRecord'
//     | 'defaultConfig'
//     | 'menuCustomSpeciesList'
//     | 'otherSpeciesList'
//     | 'setupCharacterRecord'
// >;

// @zoneController()
// export class CharacterController extends BaseZoneController<
//     State,
//     InternalState
// > {
//     public constructor(
//         userController: UserController,
//         apiService: ApiService,
//         appController: AppController,
//         fileService: FileService,
//     ) {
//         super();
//         this.#userController = userController;
//         this.#apiService = apiService;
//         this.#appController = appController;
//         this.#fileService = fileService;

//         this.#init();
//     }

//     readonly #userController;
//     readonly #apiService;
//     readonly #appController;
//     readonly #fileService;

//     #id = -1;
//     #msgId = -1;
//     #platformUserId = -1;

//     readonly #submitSymbolRecord: LibTypes.VarGeneralObj<symbol> = {};

//     readonly #submitInfoRecord: LibTypes.VarGeneralObj<LibTypes.VarDefine<{
//         submitPromise: Promise<unknown> | null,
//         submitPromiseResolve: LibTypes.SimpleFunction | null,
//         timer: LibTypes.TimerHandle | null,
//         snapshot: CharacterTypes.CharacterInfo | null,
//     }> | null> = {};

//     public readonly requestCopyableList = TaskUtils.createSerialTask(
//         async (
//             options: LibTypes.FrozenDefine<{
//                 keyword?: string,
//                 tag?: number,
//                 cursor?: string,
//             }>,
//         ) => {
//             const { tag, keyword, cursor } = options;
//             const res =
//                 await this.#apiService.call.character.list_copyable_characters({
//                     // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
//                     tag: tag as ApiTypes.Protocol.ListCopyableCharactersReq['tag'],
//                     keyword,
//                     cursor,
//                     limit: Settings.defaultLimit,
//                 });

//             const ids = res.characters.map(item => {
//                 const data = this.upsertFormApiInfo(item);
//                 item.image &&
//                     this.updateDefaultFigureSkinByApiMedia(
//                         data.id,
//                         item.image,
//                         item.bkg_main_color ?? null,
//                     );
//                 return item.character_id;
//             });

//             return {
//                 characterIds: ids,
//                 nextCursor: res.next_cursor,
//                 hasMore: res.has_more,
//             };
//         },
//     );

//     #init() {
//         this.requestDefaultConfig();
//     }

//     #bindGetter<
//         T extends
//             | CharacterTypes.InitialCharacterInfo
//             | CharacterTypes.InitialSetupCharacterInfo,
//     >(info: T) {
//         const $this = this;
//         // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
//         const result = {
//             ...info,
//             get currentTimbre() {
//                 return (
//                     this.timbres?.find(
//                         item => item.id === this.currentTimbreId,
//                     ) ?? null
//                 );
//             },
//             get isOwner() {
//                 return (
//                     this.author?.id ===
//                     $this.#userController.state.loggedInUser?.id
//                 );
//             },
//             get currentFigure() {
//                 const figure = this.currentFigures?.find(
//                     item => item.id === this.currentFigureId,
//                 );
//                 if (figure) {
//                     return figure;
//                 }

//                 return (
//                     this.currentFigures?.find(item => item.isDefault) ??
//                     this.currentFigures?.[0] ??
//                     null
//                 );
//             },
//             get currentFigureSkin() {
//                 if (this.currentFigureSkinId == null) {
//                     return this.defaultFigureSkin ?? null;
//                 }
//                 return (
//                     this.figureLib?.[this.currentFigureSkinId] ??
//                     this.defaultFigureSkin ??
//                     null
//                 );
//             },
//             get currentFigures() {
//                 return this.currentFigureSkin?.figures ?? null;
//             },

//             get currentViewFigure() {
//                 const figure = this.currentFigures?.find(
//                     item => item.id === this.currentViewFigureId,
//                 );
//                 if (figure) {
//                     return figure;
//                 }

//                 return (
//                     this.currentFigures?.find(item => item.isDefault) ??
//                     this.currentFigures?.[0] ??
//                     null
//                 );
//             },

//             get defaultFigure() {
//                 return (
//                     this.defaultFigures?.find(item => item.isDefault) ??
//                     this.defaultFigures?.[0] ??
//                     null
//                 );
//             },
//             get defaultFigures() {
//                 return this.defaultFigureSkin?.figures ?? [];
//             },
//         } as CharacterTypes.SetupCharacterInfo;

//         // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
//         return result as T extends CharacterTypes.InitialCharacterInfo
//             ? CharacterTypes.CharacterInfo
//             : CharacterTypes.SetupCharacterInfo;
//     }

//     #bindMessageListItemGetter(
//         info: CharacterTypes.InitialMessageListItem,
//     ): CharacterTypes.MessageListItem {
//         return {
//             ...info,
//             get isSuccess() {
//                 return this.status.sendCode === 'success';
//             },
//             get isError() {
//                 return this.status.sendCode === 'error';
//             },
//             get isSending() {
//                 return this.status.sendCode === 'sending';
//             },
//             get isGiftAccept() {
//                 return !!this.status.isAccept;
//             },
//         };
//     }

//     #upsert(info: CharacterTypes.InitialCharacterInfo) {
//         const id = info.id;

//         if (!this.internal.characterRecord[id]) {
//             this.internal.characterRecord[id] = this.#bindGetter(info);
//         } else {
//             ObjectUtils.safeAssignExcludeUndefined(
//                 this.internal.characterRecord[id],
//                 info,
//             );
//         }

//         return this.internal.characterRecord[id];
//     }

//     #getTimbreFromApiInfo(
//         apiVoice: ApiTypes.Protocol.CharacterVoice,
//     ): CharacterTypes.Timbre {
//         return {
//             id: apiVoice.voice_id ?? '',
//             name: apiVoice.voice_name ?? '',
//             icon: apiVoice.icon
//                 ? {
//                       uri: apiVoice.icon.url,
//                       width: apiVoice.icon.width ?? 0,
//                       height: apiVoice.icon.height ?? 0,
//                   }
//                 : null,
//             audio: apiVoice.sample
//                 ? {
//                       uri: apiVoice.sample.url,
//                       durationMS: apiVoice.sample.duration ?? 0,
//                   }
//                 : null,
//             labels: apiVoice.voice_tags ?? [],
//         };
//     }

//     #createMsgItemFromApiInfo(
//         info: ApiTypes.Protocol.PhoneMessageOutput,
//     ): CharacterTypes.MessageListItem {
//         return this.#bindMessageListItemGetter({
//             id: info.message_id ?? '',
//             isSetup: false,
//             kind:
//                 info.msg_direction === CharacterEnums.MessageApiDirection.system
//                     ? CharacterEnums.MessageItemKind.SysMsg
//                     : info.msg_type === CharacterEnums.MessageApiKind.text // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
//                       ? CharacterEnums.MessageItemKind.Msg
//                       : info.msg_type === CharacterEnums.MessageApiKind.voice // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
//                         ? CharacterEnums.MessageItemKind.Voice
//                         : info.msg_type === CharacterEnums.MessageApiKind.image // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
//                           ? CharacterEnums.MessageItemKind.Image
//                           : info.msg_type === CharacterEnums.MessageApiKind.gift // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
//                             ? CharacterEnums.MessageItemKind.GiveGift
//                             : info.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
//                                 CharacterEnums.MessageApiKind.emoji
//                               ? CharacterEnums.MessageItemKind.Meme
//                               : info.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
//                                   CharacterEnums.MessageApiKind.invitation
//                                 ? CharacterEnums.MessageItemKind.PlotEvent
//                                 : info.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
//                                     CharacterEnums.MessageApiKind.link
//                                   ? CharacterEnums.MessageItemKind.Link
//                                   : CharacterEnums.MessageItemKind.Msg,
//             fromMe:
//                 info.msg_direction === CharacterEnums.MessageApiDirection.user,

//             content: info.text?.text ?? '',

//             memeId: info.emoji?.emoji_id ?? null,

//             image:
//                 info.emoji?.emoji_id != null
//                     ? FileUtils.getImageInfoFromApiInfo(info.emoji.media)
//                     : FileUtils.getImageInfoFromApiInfo(info.image?.image),

//             audio: info.voice?.voice && {
//                 source: info.voice.voice.url,
//                 durationMS: info.voice.voice.duration ?? null,
//                 text: info.voice.text ?? '',
//             },

//             card: info.invitation && {
//                 title: info.invitation.title ?? '',
//                 desc: info.invitation.description ?? '',
//                 buttonLabel: info.invitation.button_label ?? '',
//             },

//             link: info.html_file && {
//                 title: info.html_file.html_file.name ?? '',
//                 desc: info.html_file.html_file.text ?? '',
//                 url: info.html_file.html_file.url,
//             },

//             gift: undefined,

//             readed: info.is_read ?? false,
//             clicked: info.is_click ?? false,

//             timestamp:
//                 info.created_at != null
//                     ? new Date(info.created_at)
//                     : new Date(),

//             status: {
//                 sendCode: info.is_failed ? 'error' : 'success',
//                 isAccept: undefined,
//             },
//         });
//     }

//     #createApiBaseInfo(
//         data: CharacterTypes.StateMaySetupCharacterInfo,
//     ): ApiTypes.Protocol.CharacterBasicInfo {
//         return {
//             name: data.name ?? '',
//             aka: data.honorary ?? '',

//             is_public: !!data.isPublic,

//             gender: this.getApiGender(data.gender),
//             species: data.species?.name,
//             custom_relation: {
//                 to_character_name: '',
//                 relation_name: data.relation?.title ?? '',
//                 impression_to_user: data.relation?.regard,
//             },

//             voice: {
//                 voice_id: data.currentTimbreId ?? undefined,
//             },

//             profile: data.desc ?? '',

//             recognize_others: true,
//         };
//     }

//     #createNewBehavior() {
//         const behavior: CharacterTypes.Behavior = {
//             location: undefined,
//             backgroundImage: undefined,
//             backgroundColor: undefined,
//             status: undefined,

//             currentFigure: null,

//             message: {
//                 newCount: 0,
//                 lastId: null,
//                 get lastItem() {
//                     if (this.lastId === null) {
//                         return null;
//                     }

//                     return this.record[this.lastId] ?? null;
//                 },
//                 record: {},
//             },

//             schedule: {
//                 get hasNew() {
//                     return !Object.values(this.record).some(one => !one.readed);
//                 },
//                 record: {},
//             },
//         };
//         return behavior;
//     }

//     async #requestUpdateInfo(id: CharacterTypes.CharacterId) {
//         const symbol = this.#getSubmitSymbol(id);
//         return TaskUtils.serial(symbol, async () => {
//             const submitInfo = this.#submitInfoRecord[id];
//             try {
//                 const data = this.internal.characterRecord[id];
//                 if (data) {
//                     await this.#appController.waitMoment(
//                         this.#apiService.call.character.updateBasicInfo({
//                             character_id: id,
//                             character_info: {
//                                 basic_info: this.#createApiBaseInfo(data),
//                             },
//                         }),
//                     );
//                 }
//             } catch {
//                 submitInfo?.snapshot && this.#upsert(submitInfo.snapshot);
//             } finally {
//                 submitInfo?.submitPromiseResolve?.();
//                 this.#submitInfoRecord[id] = null;
//             }
//         });
//     }

//     #execSubmit(
//         id: CharacterTypes.CharacterId,
//         setter: LibTypes.SimpleFunction,
//     ) {
//         const data = this.internal.characterRecord[id];
//         if (data) {
//             this.#submitInfoRecord[id] ??= (() => {
//                 let submitPromiseResolve = null;
//                 const submitPromise = new Promise(resolve => {
//                     submitPromiseResolve = resolve;
//                 });
//                 return {
//                     submitPromise,
//                     submitPromiseResolve,
//                     timer: null,
//                     snapshot: cloneDeep(data),
//                 };
//             })();

//             setter();

//             clearTimeout(this.#submitInfoRecord[id].timer);
//             this.#submitInfoRecord[id].timer = setTimeout(() => {
//                 this.#requestUpdateInfo(id);
//             }, Settings.requestUpdateInfoDelayMS);
//         } else {
//             this.#submitInfoRecord[id] = null;
//         }
//     }

//     #getSubmitSymbol(id: CharacterTypes.CharacterId) {
//         return this.#submitSymbolRecord[id] ?? Symbol(`submit-${id}`);
//     }

//     async #createSumbit(
//         id: CharacterTypes.CharacterId,
//         setter: LibTypes.SimpleFunction,
//         autoSync = false,
//     ) {
//         const symbol = this.#getSubmitSymbol(id);
//         if (!autoSync) {
//             await TaskUtils.getSerialCurrnet(symbol);
//             await this.#submitInfoRecord[id]?.submitPromise;
//             setter();
//         } else {
//             await TaskUtils.serial(symbol, () => this.#execSubmit(id, setter));
//         }
//     }

//     protected override getInitialInternalState(): InternalState {
//         return {
//             characterRecord: {},
//             otherSpeciesList: [],
//             menuCustomSpeciesList: [],
//             defaultConfig: null,
//             setupCharacterRecord: {},
//         };
//     }

//     public readonly requestDefaultConfig = async () => {
//         const res = await this.#apiService.call.character.body_config();
//         const defaultConfig: CharacterTypes.DefaultConfig = {
//             initialAbilityList: res.soul_words.map((item, idx) => ({
//                 id: idx.toString(),
//                 name: item.soul_word,
//                 colors: {
//                     start: item.center_color,
//                     transition: item.transition_color,
//                     end: item.edge_color,
//                 },
//                 lottie: {
//                     uri: item.emotion_resource_url ?? '',
//                     width: 0,
//                     height: 0,
//                 },
//                 percent: 0,
//             })),
//             speciesList: ArrayUtils.toDeduplicate(res.species).map(item => ({
//                 id: item,
//                 name: item,
//             })),
//             artStyleList: res.art_styles.map((item, idx) => ({
//                 id: idx.toString(),
//                 name: item.style_name,
//                 icon: {
//                     uri: item.style_icon.url,
//                     width: item.style_icon.width ?? 0,
//                     height: item.style_icon.height ?? 0,
//                 },
//             })),
//             searchTagList: res.search_tags.map((item, idx) => ({
//                 id: idx.toString(),
//                 name: item.name,
//                 value: item.value,
//             })),
//         };

//         this.internal.defaultConfig = defaultConfig;

//         return defaultConfig;
//     };

//     public readonly createNew = (
//         options: LibTypes.FrozenDefine<{
//             fromScript?: boolean,
//         }> = {},
//     ): CharacterTypes.CharacterInfo => {
//         const { fromScript } = options;

//         const info: CharacterTypes.InitialCharacterInfo = {
//             id: (this.#id--).toString(),
//             name: '',
//             honorary: '',
//             isPublic: true,
//             isInitializing: true,
//             initial: null,
//             gender: CharacterEnums.Gender.Girl,
//             species: null,
//             relation: Settings.fallbackRelation,
//             desc: '',
//             figureLib: {},
//             currentFigureSkinId: null,
//             currentFigureId: null,

//             currentViewFigureId: null,

//             currentTimbreId: null,
//             timbres: [],

//             author: this.#userController.state.loggedInUser
//                 ? {
//                       id: this.#userController.state.loggedInUser.id,
//                       name: this.#userController.state.loggedInUser.state
//                           .nickname,
//                   }
//                 : Settings.fallbackAuthor,

//             behavior: this.#createNewBehavior(),

//             fromScript: !!fromScript,
//         };

//         const data = this.#upsert(info);

//         this.watch(
//             () => this.internal.defaultConfig,
//             (defaultConfig, _, unwatch) => {
//                 if (defaultConfig) {
//                     unwatch();
//                     data.initial ??= {
//                         abilities: null,
//                         artStyle: null,
//                     };
//                     data.initial.abilities ??= cloneDeep(
//                         defaultConfig.initialAbilityList,
//                     );
//                     data.initial.artStyle ??=
//                         defaultConfig.artStyleList[0] ?? null;
//                     data.species ??=
//                         defaultConfig.speciesList[0] ??
//                         Settings.fallbackSpecies;
//                 }
//             },
//             {
//                 immediate: true,
//                 sync: true,
//             },
//         );

//         return data;
//     };

//     public readonly createSetupNew = (
//         options: LibTypes.FrozenDefine<{
//             fromScript?: boolean,
//         }> = {},
//     ): CharacterTypes.SetupCharacterInfo => {
//         const { fromScript } = options;
//         const info = this.#bindGetter({
//             id: (this.#id--).toString(),
//             isInitializing: true,
//             isSetup: true,
//             name: '',
//             honorary: '',
//             isPublic: true,
//             figureLib: {},
//             fromScript,
//         } satisfies CharacterTypes.InitialSetupCharacterInfo);
//         this.internal.setupCharacterRecord[info.id] = info;
//         return info;
//     };

//     public readonly upsertFormApiInfo = (
//         apiInfo: LibTypes.SetRequired<
//             Partial<
//                 ApiTypes.Protocol.CharacterDetailInfo &
//                     LibTypes.FrozenPick<
//                         ApiTypes.Protocol.CharacterShowInfo,
//                         'create_source'
//                     >
//             >,
//             'character_id'
//         >,
//         isInitializing = false,
//     ) => {
//         const figureLib: CharacterTypes.FigureLib = {};
//         apiInfo.outfits?.forEach(item => {
//             figureLib[item.outfit_id] = {
//                 id: item.outfit_id,
//                 name: '',
//                 backgroundColor: item.bkg_main_color ?? null,
//                 figures: item.appearances.map(figure => ({
//                     id: figure.appearance_id,
//                     name: figure.appearance_name,
//                     isDefault: figure.is_default,
//                     visual: this.#fileService.createImageResource(
//                         figure.image.id,
//                         FileUtils.getImageInfoFromApiInfo(figure.image),
//                     ),
//                 })),
//             };
//         });

//         const currentInfo = this.internal.characterRecord[apiInfo.character_id];

//         const info: CharacterTypes.InitialCharacterInfo = {
//             id: apiInfo.character_id,
//             initial: null,
//             isInitializing,
//             name: apiInfo.name ?? '',
//             honorary: apiInfo.aka ?? '',
//             isPublic: !!apiInfo.is_public,
//             gender: this.getGender(apiInfo.gender),
//             species: !StringUtils.isEmpty(apiInfo.species)
//                 ? {
//                       id: apiInfo.species,
//                       name: apiInfo.species,
//                   }
//                 : Settings.fallbackSpecies,
//             relation: {
//                 characterName: '你', // TODO
//                 title:
//                     apiInfo.custom_relation?.relation_name ??
//                     currentInfo?.relation.title ??
//                     '',
//                 regard:
//                     apiInfo.custom_relation?.impression_to_user ??
//                     currentInfo?.relation.regard ??
//                     '', // TODO
//             },
//             desc: apiInfo.profile ?? '',
//             figureLib,
//             author: apiInfo.author
//                 ? {
//                       id: apiInfo.author.is_platform
//                           ? `${this.#platformUserId--}`
//                           : apiInfo.author.uid,
//                       name: apiInfo.author.user_name,
//                   }
//                 : (currentInfo?.author ?? Settings.fallbackAuthor), // TODO

//             currentTimbreId: apiInfo.voice?.voice_id ?? null,
//             timbres: apiInfo.voice
//                 ? [this.#getTimbreFromApiInfo(apiInfo.voice)]
//                 : [],

//             currentFigureSkinId:
//                 apiInfo.current_outfit_id ??
//                 currentInfo?.currentFigureSkinId ??
//                 null,
//             currentFigureId:
//                 apiInfo.current_appearance_id ??
//                 currentInfo?.currentFigureId ??
//                 null,

//             currentViewFigureId: currentInfo?.currentViewFigureId ?? null,

//             behavior: currentInfo?.behavior ?? this.#createNewBehavior(),

//             relationships:
//                 apiInfo.pre_made_relations?.map(item => ({
//                     characterName: item.to_character_name,
//                     title: item.relation_name,
//                     regard: item.impression_to_user ?? '',
//                 })) ?? currentInfo?.relationships,
//             stats: {
//                 abilityValue: apiInfo.ability_sum ?? 0,
//                 abilities:
//                     apiInfo.abilities?.map(item => ({
//                         id: item.ability_name,
//                         emoji: item.ability_emoji,
//                         name: item.ability_name,
//                         desc: item.ability_desc,
//                         value: item.ability_value,
//                     })) ?? [],
//                 evaluation: apiInfo.ability_evaluation ?? '',
//                 skills:
//                     apiInfo.skills?.map(skill => ({
//                         id: skill.skill_name,
//                         name: skill.skill_name,
//                         levelText: skill.skill_level,
//                     })) ?? [],
//             },

//             fromScript:
//                 apiInfo.create_source == null
//                     ? !!currentInfo?.fromScript
//                     : apiInfo.create_source === 'script',
//         };
//         const result = this.#upsert(info);

//         result.currentViewFigureId ??= result.currentViewFigure?.id ?? null;

//         if (
//             result.currentViewFigureId != null &&
//             !result.currentFigures?.find(
//                 item => item.id === result.currentViewFigureId,
//             )
//         ) {
//             result.currentViewFigureId = result.currentViewFigure?.id ?? null;
//         }

//         return result;
//     };

//     public readonly update = <
//         K extends
//             LibTypes.WritableKeysDeepOf<CharacterTypes.InitialCharacterInfo>,
//     >(
//         id: CharacterTypes.CharacterId,
//         keyPath: K,
//         value: LibTypes.Get<CharacterTypes.InitialCharacterInfo, K>,
//         options: LibTypes.FrozenDefine<{
//             autoSync?: boolean,
//         }> = {},
//     ) => {
//         const data =
//             this.internal.characterRecord[id] ??
//             this.internal.setupCharacterRecord[id];

//         if (data) {
//             if (data.isInitializing) {
//                 set(data, keyPath, value);
//             } else {
//                 this.#createSumbit(
//                     id,
//                     () => {
//                         set(data, keyPath, value);
//                     },
//                     options.autoSync,
//                 );
//             }
//         }
//     };

//     public readonly upsert = (
//         params:
//             | CharacterTypes.InitialCharacterInfo
//             | LibTypes.Arr<CharacterTypes.InitialCharacterInfo>,
//     ) => {
//         const list = params instanceof Array ? params : [params];

//         list.forEach(item => this.#upsert(item));
//     };

//     public readonly pushMenuCustomSpecies = (name: string) => {
//         const newOne: CharacterTypes.Species = {
//             id: name,
//             name,
//         };
//         this.internal.menuCustomSpeciesList = [
//             ...this.internal.menuCustomSpeciesList,
//             newOne,
//         ];
//         return newOne;
//     };

//     public readonly deleteMenuCustomSpecies = (
//         id: CharacterTypes.Species['id'],
//     ) => {
//         this.internal.menuCustomSpeciesList = ArrayUtils.toDeleteItem(
//             this.internal.menuCustomSpeciesList,
//             this.internal.menuCustomSpeciesList.findIndex(
//                 item => item.id === id,
//             ),
//         );
//     };

//     public readonly updateMenuCustomSpeciesList = (
//         speciesList: LibTypes.Arr<CharacterTypes.Species>,
//     ) => {
//         this.internal.menuCustomSpeciesList = speciesList;
//     };

//     public readonly updateDefaultFigureSkinByApiMedia = (
//         id: CharacterTypes.CharacterId,
//         image: ApiTypes.Protocol.Media,
//         backgroundColor: string | null = null,
//     ) => {
//         this.updateDefaultFigureSkin(
//             id,
//             this.#fileService.createImageResource(
//                 image.id,
//                 FileUtils.getImageInfoFromApiInfo(image),
//             ),
//             backgroundColor,
//         );
//     };

//     public readonly updateDefaultFigureSkin = (
//         id: CharacterTypes.CharacterId,
//         image: FileTypes.ImageResource,
//         backgroundColor: string | null = null,
//     ) => {
//         this.update(id, 'defaultFigureSkin', {
//             id: Settings.defaultFigureSkinId,
//             name: '',
//             backgroundColor,
//             figures: [
//                 {
//                     id: Settings.defaultFigureId,
//                     name: '',
//                     isDefault: true,
//                     visual: image,
//                 },
//             ],
//         });
//     };

//     public readonly updateFigure = (
//         id: CharacterTypes.CharacterId,
//         skinId: string,
//         figureId: string,
//         image: FileTypes.ImageResource,
//     ) => {
//         const data = this.internal.characterRecord[id];
//         if (data) {
//             const figureLib = {
//                 ...data.figureLib,
//             };
//             const skin = figureLib[skinId];
//             if (skin) {
//                 const index = skin.figures.findIndex(
//                     item => item.id === figureId,
//                 );
//                 if (skin.figures[index]) {
//                     skin.figures[index].visual = image;
//                 }
//             }
//         }
//     };

//     public readonly updateInitialAbilityPercent = (
//         characterId: CharacterTypes.CharacterId,
//         initialAbilityId: string,
//         percent: number,
//     ) => {
//         const character = this.internal.characterRecord[characterId];
//         if (!character?.initial?.abilities) {
//             return;
//         }

//         const ability = character.initial.abilities.find(
//             item => item.id === initialAbilityId,
//         );
//         if (ability) {
//             ability.percent = percent;
//         }
//     };

//     public readonly updateScheduleListItem = <
//         K extends LibTypes.WritableKeysDeepOf<CharacterTypes.ScheduleListItem>,
//     >(
//         characterId: CharacterTypes.CharacterId,
//         itemId: CharacterTypes.ScheduleListItem['id'],
//         keyPath: K,
//         value: LibTypes.Get<CharacterTypes.ScheduleListItem, K>,
//     ) => {
//         const item =
//             this.internal.characterRecord[characterId]?.behavior.schedule
//                 .record[itemId];
//         if (item) {
//             set(item, keyPath, value);
//         }
//     };

//     public readonly updateMessageListItem = <
//         K extends LibTypes.WritableKeysDeepOf<CharacterTypes.MessageListItem>,
//     >(
//         characterId: CharacterTypes.CharacterId,
//         itemId: CharacterTypes.MessageListItem['id'],
//         keyPath: K,
//         value: LibTypes.Get<CharacterTypes.MessageListItem, K>,
//     ) => {
//         const item =
//             this.internal.characterRecord[characterId]?.behavior.message.record[
//                 itemId
//             ];
//         if (item) {
//             set(item, keyPath, value);
//         }
//     };

//     public readonly upsertMessageListItem = (
//         characterId: CharacterTypes.CharacterId,
//         newItem: CharacterTypes.MessageListItem,
//     ) => {
//         const data = this.internal.characterRecord[characterId];

//         if (data) {
//             const item = data.behavior.message.record[newItem.id];

//             if (item) {
//                 ObjectUtils.safeAssignExcludeUndefined(item, newItem);
//             } else {
//                 data.behavior.message.record[newItem.id] = newItem;
//                 if (data.behavior.message.lastId == null) {
//                     data.behavior.message.lastId = newItem.id;
//                 } else if (data.behavior.message.lastItem) {
//                     if (
//                         newItem.timestamp >
//                         data.behavior.message.lastItem.timestamp
//                     ) {
//                         data.behavior.message.lastId = newItem.id;
//                     }
//                 }
//             }

//             return data.behavior.message.record[newItem.id] ?? null;
//         }

//         return null;
//     };

//     public readonly requestTimbres = async (
//         data: CharacterTypes.StateMaySetupCharacterInfo,
//     ) => {
//         const res = await this.#apiService.call.character.list_character_voices(
//             {
//                 species: data.species?.name ?? undefined,
//                 gender: this.getApiGender(data.gender),
//                 limit: Settings.timbresLimit,
//             },
//         );

//         const currentTimbre = data.currentTimbre;
//         const timbres = res.voices.map(item =>
//             this.#getTimbreFromApiInfo(item));

//         if (
//             currentTimbre &&
//             !timbres.find(item => item.id === currentTimbre.id)
//         ) {
//             timbres.push(currentTimbre);
//         }

//         this.update(data.id, 'timbres', timbres);
//     };

//     public readonly requestCharacterInfo = async (
//         id: CharacterTypes.CharacterId,
//     ) => {
//         try {
//             const res = await this.#apiService.call.character.detail({
//                 character_id: id,
//             });
//             const info = this.upsertFormApiInfo(res.character);
//             return info;
//         } catch {
//             return null;
//         }
//     };

//     public readonly requestAddRoleList = async (
//         options: LibTypes.FrozenDefine<{
//             keyword?: string,
//             cursor?: string,
//         }>,
//     ) => {
//         const { keyword, cursor } = options;
//         const res =
//             await this.#apiService.call.script.list_selectable_characters({
//                 query: keyword ?? '',
//                 cursor,
//                 limit: Settings.defaultLimit,
//             });

//         const ids = res.lists.map(item => {
//             const data = this.upsertFormApiInfo(item);
//             item.image &&
//                 this.updateDefaultFigureSkinByApiMedia(
//                     data.id,
//                     item.image,
//                     item.bkg_main_color ?? null,
//                 );
//             return item.character_id;
//         });

//         return {
//             characterIds: ids,
//             nextCursor: res.next_cursor,
//             hasMore: res.has_more,
//         };
//     };

//     public readonly requestMyList = async () => {
//         const res = await this.#apiService.call.character.list_my_characters();
//         console.log('requestMyList', res);
//         const ids = res.characters.map(item => {
//             const data = this.upsertFormApiInfo(item.basic_info);

//             this.update(
//                 data.id,
//                 'behavior.location',
//                 item.current_schedule?.character_loc,
//             );
//             this.update(
//                 data.id,
//                 'behavior.status',
//                 item.current_schedule?.character_state,
//             );
//             if (item.current_schedule?.character_loc_bkg) {
//                 this.update(
//                     data.id,
//                     'behavior.backgroundImage',
//                     this.#fileService.createImageResource(
//                         item.current_schedule.character_loc_bkg.id,
//                         FileUtils.getImageInfoFromApiInfo(
//                             item.current_schedule.character_loc_bkg,
//                         ),
//                     ),
//                 );
//             }
//             this.update(
//                 data.id,
//                 'behavior.backgroundColor',
//                 item.basic_info.bkg_main_color,
//             );

//             if (item.basic_info.image) {
//                 this.update(
//                     data.id,
//                     'behavior.currentFigure',
//                     this.#fileService.createImageResource(
//                         item.basic_info.image.id,
//                         FileUtils.getImageInfoFromApiInfo(
//                             item.basic_info.image,
//                         ),
//                     ),
//                 );
//             }

//             this.update(
//                 data.id,
//                 'behavior.message.newCount',
//                 item.unread_count,
//             );

//             item.latest_message &&
//                 this.upsertMessageListItem(
//                     data.id,
//                     this.#createMsgItemFromApiInfo(item.latest_message),
//                 );

//             return item.basic_info.character_id;
//         });

//         this.#userController.setMyCharacterList(ids);
//     };

//     public readonly getGender = (apiGender: LibTypes.Nullable<string>) =>
//         apiGender === CharacterEnums.ApiGender.Boy
//             ? CharacterEnums.Gender.Boy
//             : apiGender === CharacterEnums.ApiGender.Girl
//               ? CharacterEnums.Gender.Girl
//               : CharacterEnums.Gender.Other;

//     public readonly getApiGender = (
//         apiGender: LibTypes.Nullable<CharacterEnums.Gender>,
//     ) =>
//         apiGender === CharacterEnums.Gender.Boy
//             ? CharacterEnums.ApiGender.Boy
//             : apiGender === CharacterEnums.Gender.Girl
//               ? CharacterEnums.ApiGender.Girl
//               : CharacterEnums.ApiGender.Other;

//     public readonly requestSoulsEvaluation = async (
//         abilities: LibTypes.Arr<
//             LibTypes.FrozenPick<
//                 CharacterTypes.InitialAbility,
//                 'name' | 'percent'
//             >
//         >,
//     ) => {
//         const res =
//             await this.#apiService.call.character.get_soul_word_evaluation({
//                 abilities: abilities.map(
//                     item =>
//                         ({
//                             ability_name: item.name,
//                             ability_value: Math.round(item.percent),
//                         }) satisfies ApiTypes.Protocol.SoulWordAbilityInput,
//                 ),
//             });

//         return res.evaluation;
//     };

//     public readonly requestSchedules = async (
//         id: CharacterTypes.CharacterId,
//         date: Date,
//     ) => {
//         const data = this.internal.characterRecord[id];
//         if (data) {
//             const res =
//                 await this.#apiService.call.character.list_schedule_by_day({
//                     character_id: id,
//                     current_time: date.getTime().toString(),
//                 });

//             res.schedules.forEach(item => {
//                 data.behavior.schedule.record[item.schedule_id] = {
//                     id: item.schedule_id,
//                     name: item.schedule_name ?? '',
//                     detail: item.detail ?? '',
//                     location: item.character_loc ?? '',
//                     status: item.character_state ?? '',
//                     start: new Date(item.schedule_start_time ?? ''),
//                     end: new Date(item.schedule_end_time ?? ''),
//                     readed: item.viewed,
//                 };
//             });

//             console.log(data);
//         }
//     };

//     public readonly requestScheduleViewStatus = async (id: string) => {
//         await this.#apiService.call.character.update_schedule_viewed_status({
//             schedule_ids: [id],
//             view_status: true,
//         });
//     };

//     public readonly requestGenerateFromSoul = async (
//         data: CharacterTypes.StateCharacterInfo,
//     ) => {
//         const res = await this.#apiService.call.character.gen_from_soul(
//             {
//                 body_config: {
//                     soul_word_configs:
//                         data.initial?.abilities?.map(
//                             item =>
//                                 ({
//                                     soul_word: item.name,
//                                     word_type: 1,
//                                     strength: Math.round(item.percent),
//                                 }) satisfies ApiTypes.Protocol.SoulWordConfig,
//                         ) ?? [],
//                     gender: this.getApiGender(data.gender),
//                     species: data.species?.name ?? '',
//                     custom_relation: {
//                         relation_name: data.relation.title,
//                         impression_to_user: data.relation.regard,
//                     },
//                     style_name: data.initial?.artStyle?.name ?? '',
//                     anything_to_add: data.desc,
//                 },
//             },
//             { isLongTask: true },
//         );

//         const info = this.upsertFormApiInfo(
//             {
//                 character_id: `${this.#id--}`,
//                 ...res.character.basic_info,
//             },
//             true,
//         );

//         res.character.image_show &&
//             this.updateDefaultFigureSkinByApiMedia(
//                 info.id,
//                 res.character.image_show,
//                 res.character.bkg_main_color ?? null,
//             );

//         return info;
//     };

//     public readonly requestCreate = async (
//         data: CharacterTypes.StateMaySetupCharacterInfo,
//     ) => {
//         const res = await this.#apiService.call.character.create(
//             {
//                 character: {
//                     basic_info: this.#createApiBaseInfo(data),
//                     image_upload: {
//                         bucket_name: '',
//                         object_key: '',
//                         object_type: '',
//                         url: data.defaultFigure?.visual.uri,
//                         request_id: '',
//                     },
//                 },
//                 source_character_id: data.isInitializing ? undefined : data.id,
//                 source: data.fromScript ? 'script' : 'character',
//             },
//             { isLongTask: true },
//         );

//         await this.requestCharacterInfo(res.character_id);

//         return {
//             id: res.character_id,
//             openingId: res.opening_log_id,
//         };
//     };

//     public readonly requestMessageList = async (
//         id: CharacterTypes.CharacterId,
//         direction: ApiTypes.Protocol.ListCharacterPhoneChatHistoryReq['direction'] & {},
//         cursor: string | null,
//     ) => {
//         const res =
//             await this.#apiService.call.character.list_phone_chat_history({
//                 character_id: id,
//                 direction,
//                 cursor: cursor ?? undefined,
//                 limit: Settings.msgLimit,
//             });

//         const list = res.msgs
//             .map(item =>
//                 this.upsertMessageListItem(
//                     id,
//                     this.#createMsgItemFromApiInfo(item),
//                 ))
//             .filter(item => !!item);

//         return {
//             ids: list.map(item => item.id),
//             upCursor: res.min_cursor,
//             downCursor: res.max_cursor,
//             upHasMore: res.up_has_more,
//             downHasMore: res.down_has_more,
//         };
//     };

//     public readonly createNewMsgItem = (
//         kind: CharacterEnums.MessageItemKind,
//         info: Partial<
//             LibTypes.FrozenPick<
//                 CharacterTypes.InitialMessageListItem,
//                 'audio' | 'content' | 'image' | 'memeId'
//             >
//         >,
//         sending = false,
//     ) =>
//         this.#bindMessageListItemGetter({
//             id: `${this.#msgId--}`,
//             isSetup: true,
//             kind,
//             fromMe: true,

//             content: info.content ?? '',
//             memeId: info.memeId,
//             image: info.image,
//             audio: info.audio,

//             card: null,
//             gift: null,
//             link: null,

//             timestamp: new Date(),

//             readed: true,

//             status: {
//                 sendCode: sending ? 'sending' : 'success',
//             },
//         });

//     public readonly requestSendMsg = async (
//         characterId: CharacterTypes.CharacterId,
//         newMsgs: LibTypes.VarArr<CharacterTypes.MessageInput>,
//         resendMessageId: LibTypes.Nullable<string>,
//         scene: CharacterEnums.MessageApiChatScene = CharacterEnums
//             .MessageApiChatScene.phone,
//     ) => {
//         try {
//             const data = this.internal.characterRecord[characterId];
//             const resendItem =
//                 resendMessageId == null
//                     ? null
//                     : data?.behavior.message.record[resendMessageId];

//             const res =
//                 await this.#apiService.call.character.chat_with_character(
//                     {
//                         character_id: characterId,
//                         messages: newMsgs,
//                         chat_scene: scene,
//                         resend_message_id: resendItem?.isSetup
//                             ? undefined
//                             : resendItem?.id,
//                     },
//                     { timeoutMS: Settings.chatTimeoutMS },
//                 );

//             const currentList = res.current_messages
//                 .map((item, index) => {
//                     const info = this.upsertMessageListItem(
//                         characterId,
//                         this.#createMsgItemFromApiInfo(item),
//                     );

//                     const inputItem = newMsgs[index];
//                     if (inputItem && info) {
//                         this.updateMessageListItem(
//                             characterId,
//                             inputItem.id,
//                             'timestamp',
//                             info.timestamp,
//                         );
//                         this.updateMessageListItem(
//                             characterId,
//                             inputItem.id,
//                             'isSetup',
//                             false,
//                         );
//                         this.updateMessageListItem(
//                             characterId,
//                             inputItem.id,
//                             'status.sendCode',
//                             info.isError ? 'error' : 'success',
//                         );

//                         const oldId = inputItem.id;
//                         const newId = info.id;

//                         this.updateMsgItemId(characterId, oldId, newId);
//                     }

//                     return info;
//                 })
//                 .filter(item => !!item);

//             const characterList =
//                 res.character_messages
//                     ?.map(item =>
//                         this.upsertMessageListItem(
//                             characterId,
//                             this.#createMsgItemFromApiInfo(item),
//                         ))
//                     .filter(item => !!item) ?? [];

//             return {
//                 currentList,
//                 characterList,
//             };
//         } catch {
//             newMsgs.forEach(item => {
//                 this.updateMessageListItem(
//                     characterId,
//                     item.id,
//                     'status.sendCode',
//                     'error',
//                 );
//             });

//             return null;
//         }
//     };

//     public readonly updateMsgItemId = (
//         characterId: CharacterTypes.CharacterId,
//         oldId: string,
//         newId: string,
//     ) => {
//         const info = this.internal.characterRecord[characterId];
//         if (info) {
//             const item = info.behavior.message.record[oldId];
//             if (item) {
//                 // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//                 delete info.behavior.message.record[oldId];
//                 item.id = newId;
//                 this.upsertMessageListItem(characterId, item);
//             }
//         }
//     };
// }
