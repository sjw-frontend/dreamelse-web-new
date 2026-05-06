// @ts-nocheck
import { cloneDeep } from 'lodash';

import { BaseZoneController, zoneController } from '$/core';
import { DataStoreDomain, DataStoreRemoteDomain } from '$/domains';
import { CharacterEnums } from '$/enums';
import { ApiService, FileService } from '$/services';
import type { ApiTypes, CharacterTypes, FileTypes } from '$/types';
import { ArrayUtils, FileUtils, JSONUtils } from '$/utils';

import { AppController } from '../app/app-controller';
import { UserController } from '../user/user-controller';

import { Settings } from './character-const';

type InternalState = LibTypes.VarDefine<{
    defaultConfig: CharacterTypes.DefaultConfig | null,
    otherSpeciesList: LibTypes.Arr<CharacterTypes.Species>,
    menuCustomSpeciesList: LibTypes.Arr<CharacterTypes.Species>,
    waitCharacterOpeningLoadingTextList: LibTypes.Arr<string>,
    waitCharacterSoulLoadingTextList: LibTypes.Arr<string>,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'defaultConfig'
    | 'menuCustomSpeciesList'
    | 'otherSpeciesList'
    | 'waitCharacterOpeningLoadingTextList'
    | 'waitCharacterSoulLoadingTextList'
>;

@zoneController()
export class CharacterController extends BaseZoneController<
    State,
    InternalState
> {
    public constructor(
        userController: UserController,
        apiService: ApiService,
        appController: AppController,
        fileService: FileService,
    ) {
        super();
        this.#userController = userController;
        this.#apiService = apiService;
        this.#appController = appController;
        this.#fileService = fileService;

        this.#watch();
        this.#init();
    }

    readonly #userController;
    readonly #apiService;
    readonly #appController;
    readonly #fileService;

    #id = -1;
    #msgId = -1;
    #platformUserId = -1;

    //#region dataStore
    readonly #messageDataStore = this.getDomain(
        DataStoreDomain<
            CharacterTypes.MessageState,
            CharacterTypes.MessageAttrs
        >,
        {
            dataSizeLimit: Settings.dataSizeLimit,
        },
    );

    readonly #scheduleDataStore = this.getDomain(
        DataStoreDomain<
            CharacterTypes.ScheduleState,
            CharacterTypes.ScheduleAttrs
        >,
    );

    readonly #characterDataStore = this.getDomain(
        DataStoreRemoteDomain<
            CharacterTypes.CharacterState,
            CharacterTypes.CharacterAttrs
        >,
        {
            dataSizeLimit: Settings.dataSizeLimit,
            requestUpdateToRemote: async data => {
                await this.#appController.waitMoment(
                    this.#apiService.call.character.updateBasicInfo({
                        character_id: data.id,
                        character_info: {
                            basic_info: this.#createApiCharacterBaseInfo(data),
                        },
                    }),
                );
            },
        },
    );
    //#endregion

    //#region set value
    public readonly setCharacterState = this.#characterDataStore.setState;
    public readonly getCharacter = this.#characterDataStore.get;

    public readonly setMessageState = this.#messageDataStore.setState;
    public readonly getMessage = this.#messageDataStore.get;

    public readonly setScheduleState = this.#scheduleDataStore.setState;
    public readonly getSchedule = this.#scheduleDataStore.get;
    //#endregion

    #watch() {
        this.watch(
            () => this.#appController.state.remoteConfig,
            remoteConfig => {
                this.internal.waitCharacterOpeningLoadingTextList =
                    remoteConfig.waitCharacterOpeningLoadingTextList ?? [];
                this.internal.waitCharacterSoulLoadingTextList =
                    remoteConfig.waitCharacterSoulLoadingTextList ?? [];
            },
            {
                immediate: true,
            },
        );
    }

    #init() {
        this.requestDefaultConfig();
    }

    //#region create
    #createMessageState(
        info: CharacterTypes.InitialMessageState,
    ): CharacterTypes.MessageState {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const state = { ...info } as CharacterTypes.MessageState;
        Object.defineProperties(state, {
            isSuccess: {
                get(this: CharacterTypes.MessageState) {
                    return this.status.sendCode === 'success';
                },
                enumerable: true,
                configurable: true,
            },
            isError: {
                get(this: CharacterTypes.MessageState) {
                    return this.status.sendCode === 'error';
                },
                enumerable: true,
                configurable: true,
            },
            isSending: {
                get(this: CharacterTypes.MessageState) {
                    return this.status.sendCode === 'sending';
                },
                enumerable: true,
                configurable: true,
            },
            isGiftAccept: {
                get(this: CharacterTypes.MessageState) {
                    return this.status.isAccept;
                },
                enumerable: true,
                configurable: true,
            },
        });
        return state;
    }

    #createNewBehavior() {
        const behavior: CharacterTypes.Behavior = {
            location: null,
            backgroundImage: null,
            backgroundColor: null,
            status: null,
            currentFigureVisual: null,
            lastMessage: null,

            newMessageCount: 0,
        };
        return behavior;
    }

    #createCharacterState(initialState: CharacterTypes.InitialCharacterState) {
        const $this = this;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const state = { ...initialState } as CharacterTypes.CharacterState;

        Object.defineProperties(state, {
            currentTimbre: {
                get(this: CharacterTypes.CharacterState) {
                    return (
                        this.timbres.find(
                            item => item.id === this.currentTimbreId,
                        ) ?? null
                    );
                },
                enumerable: true,
                configurable: true,
            },
            isOwner: {
                get(this: CharacterTypes.CharacterState) {
                    return (
                        this.author?.id ===
                        $this.#userController.state.loggedInUser?.id
                    );
                },
                enumerable: true,
                configurable: true,
            },
            currentFigure: {
                get(this: CharacterTypes.CharacterState) {
                    const figure = this.currentFigures?.find(
                        item => item.id === this.currentFigureId,
                    );
                    if (figure) {
                        return figure;
                    }
                    return (
                        this.currentFigures?.find(item => item.isDefault) ??
                        this.currentFigures?.[0] ??
                        null
                    );
                },
                enumerable: true,
                configurable: true,
            },
            currentFigureSkin: {
                get(this: CharacterTypes.CharacterState) {
                    if (this.currentFigureSkinId == null) {
                        return this.defaultFigureSkin ?? null;
                    }
                    return (
                        this.figureLib[this.currentFigureSkinId] ??
                        this.defaultFigureSkin ??
                        null
                    );
                },
                enumerable: true,
                configurable: true,
            },
            currentFigures: {
                get(this: CharacterTypes.CharacterState) {
                    return this.currentFigureSkin?.figures ?? null;
                },
                enumerable: true,
                configurable: true,
            },
            currentViewFigure: {
                get(this: CharacterTypes.CharacterState) {
                    const figure = this.currentFigures?.find(
                        item => item.id === this.currentViewFigureId,
                    );
                    if (figure) {
                        return figure;
                    }
                    return (
                        this.currentFigures?.find(item => item.isDefault) ??
                        this.currentFigures?.[0] ??
                        null
                    );
                },
                enumerable: true,
                configurable: true,
            },
            defaultFigure: {
                get(this: CharacterTypes.CharacterState) {
                    return (
                        this.defaultFigures?.find(item => item.isDefault) ??
                        this.defaultFigures?.[0] ??
                        null
                    );
                },
                enumerable: true,
                configurable: true,
            },
            defaultFigures: {
                get(this: CharacterTypes.CharacterState) {
                    return this.defaultFigureSkin?.figures ?? [];
                },
                enumerable: true,
                configurable: true,
            },
        });

        return state;
    }
    //#endregion

    //#region update
    async #updateCharacterLastMessage(
        newItem: CharacterTypes.FrozenMessageInfo,
        force = false,
    ) {
        const characterInfo = newItem.characterInfo;
        const lastMessage = characterInfo.state.behavior.lastMessage;

        if (lastMessage == null) {
            await this.#characterDataStore.setState(
                characterInfo.id,
                'behavior',
                prevValue => ({
                    ...prevValue,
                    lastMessage: newItem,
                }),
            );
        } else if (
            newItem.state.timestamp > lastMessage.state.timestamp ||
            force
        ) {
            await this.#characterDataStore.setState(
                characterInfo.id,
                'behavior',
                prevValue => ({
                    ...prevValue,
                    lastMessage: newItem,
                }),
            );
        }
    }
    //#endregion

    //#region handel api info
    #createCharacterStateFromApiInfo(apiInfo: CharacterTypes.ApiCharacterInfo) {
        const id = apiInfo.character_id;
        const characterInfo = this.#characterDataStore.get(id);

        const figureLib: CharacterTypes.FigureLib = {};
        apiInfo.outfits?.forEach(item => {
            figureLib[item.outfit_id] = {
                id: item.outfit_id,
                name: '',
                backgroundColor: item.bkg_main_color ?? null,
                figures: item.appearances.map(figure => ({
                    id: figure.appearance_id,
                    name: figure.appearance_name,
                    isDefault: figure.is_default,
                    visual: this.#fileService.createImageResource(
                        figure.image.id,
                        FileUtils.getImageInfoFromApiInfo(figure.image),
                    ),
                })),
            };
        });

        const initialState: CharacterTypes.InitialCharacterState = {
            initial: null,

            figureLib: apiInfo.outfits
                ? figureLib
                : (characterInfo?.state.figureLib ?? {}),

            name: apiInfo.name ?? characterInfo?.state.name ?? '',
            honorary: apiInfo.aka ?? characterInfo?.state.honorary ?? '',
            isPublic: !!(apiInfo.is_public ?? characterInfo?.state.isPublic),
            desc: apiInfo.profile ?? characterInfo?.state.desc ?? '',

            gender:
                this.getGender(apiInfo.gender) ??
                characterInfo?.state.gender ??
                CharacterEnums.Gender.Other,

            species:
                apiInfo.species != null
                    ? {
                          id: apiInfo.species,
                          name: apiInfo.species,
                      }
                    : (characterInfo?.state.species ?? null),

            relation: apiInfo.custom_relation
                ? {
                      characterName: '你', // TODO
                      title: apiInfo.custom_relation.relation_name,
                      regard: apiInfo.custom_relation.impression_to_user ?? '',
                      weight: null,
                  }
                : (characterInfo?.state.relation ?? null),

            author: apiInfo.author
                ? {
                      id: apiInfo.author.is_platform
                          ? `c-${this.#platformUserId--}`
                          : apiInfo.author.uid,
                      name: apiInfo.author.user_name,
                  }
                : (characterInfo?.state.author ?? null),

            currentTimbreId:
                apiInfo.voice?.voice_id ??
                characterInfo?.state.currentTimbreId ??
                null,

            timbres: apiInfo.voice
                ? [this.#createTimbreFromApiInfo(apiInfo.voice)]
                : (characterInfo?.state.timbres ?? []),

            currentFigureSkinId:
                apiInfo.current_outfit_id ??
                characterInfo?.state.currentFigureSkinId ??
                null,

            currentFigureId:
                apiInfo.current_appearance_id ??
                characterInfo?.state.currentFigureId ??
                null,

            relationships:
                apiInfo.pre_made_relations?.map(item => ({
                    characterName: item.to_character_name,
                    title: item.relation_name,
                    regard: item.impression_to_user ?? '',
                    weight: null,
                })) ??
                characterInfo?.state.relationships ??
                null,

            stats: apiInfo.abilities
                ? {
                      abilityValue: apiInfo.ability_sum ?? 0,
                      abilities: apiInfo.abilities.map(item => ({
                          id: item.ability_name,
                          emoji: item.ability_emoji,
                          name: item.ability_name,
                          desc: item.ability_desc,
                          value: item.ability_value,
                      })),
                      evaluation: apiInfo.ability_evaluation ?? '',
                      skills:
                          apiInfo.skills?.map(skill => ({
                              id: skill.skill_name,
                              name: skill.skill_name,
                              levelText: skill.skill_level,
                          })) ?? [],
                  }
                : (characterInfo?.state.stats ?? null),

            currentViewFigureId:
                characterInfo?.state.currentViewFigureId ?? null,

            behavior:
                characterInfo?.state.behavior ?? this.#createNewBehavior(),

            defaultFigureSkin: characterInfo?.state.defaultFigureSkin ?? null,
            isMe: false,
        };

        const state = this.#createCharacterState(initialState);

        state.currentViewFigureId ??= state.currentViewFigure?.id ?? null;

        if (
            state.currentViewFigureId != null &&
            !state.currentFigures?.find(
                item => item.id === state.currentViewFigureId,
            )
        ) {
            state.currentViewFigureId = state.currentViewFigure?.id ?? null;
        }

        return state;
    }

    #createTimbreFromApiInfo(
        apiVoice: ApiTypes.Protocol.CharacterVoice,
    ): CharacterTypes.Timbre {
        return {
            id: apiVoice.voice_id ?? '',
            name: apiVoice.voice_name ?? '',
            icon: apiVoice.icon
                ? {
                      uri: apiVoice.icon.url,
                      width: apiVoice.icon.width ?? 0,
                      height: apiVoice.icon.height ?? 0,
                  }
                : null,
            audio: apiVoice.sample
                ? {
                      uri: apiVoice.sample.url,
                      durationMS: apiVoice.sample.duration ?? 0,
                  }
                : null,
            labels: apiVoice.voice_tags ?? [],
        };
    }

    #logUnexpectedMessageType(
        source: 'chat' | 'history',
        apiInfo: ApiTypes.Protocol.PhoneMessageOutput,
    ) {
        if (!__DEV__) {
            return;
        }

        const knownTypes = new Set<string>([
            CharacterEnums.MessageApiKind.text,
            CharacterEnums.MessageApiKind.voice,
            CharacterEnums.MessageApiKind.image,
            CharacterEnums.MessageApiKind.gift,
            CharacterEnums.MessageApiKind.emoji,
            CharacterEnums.MessageApiKind.invitation,
            CharacterEnums.MessageApiKind.link,
        ]);

        if (
            apiInfo.msg_direction === CharacterEnums.MessageApiDirection.system ||
            knownTypes.has(apiInfo.msg_type)
        ) {
            return;
        }

        console.warn(
            '[CharacterController] Unexpected message type received',
            {
                source,
                msgType: apiInfo.msg_type,
                direction: apiInfo.msg_direction,
                payload: JSONUtils.safeStringify(apiInfo),
            },
        );
    }

    #logChatPayload(
        req: ApiTypes.Protocol.ChatWithCharacterReq,
        res: ApiTypes.Protocol.ChatWithCharacterResp,
    ) {
        if (!__DEV__) {
            return;
        }

        console.info('[CharacterController] chat_with_character summary', {
            requestMessages: req.messages.map(item => ({
                id: 'id' in item ? item.id : undefined,
                msgType: item.msg_type,
                hasText: item.text?.text != null,
                hasVoice: item.voice?.voice.url != null,
                hasImage: item.image?.image.url != null,
            })),
            currentMessages: res.current_messages.map(item => ({
                messageId: item.message_id,
                msgType: item.msg_type,
                direction: item.msg_direction,
                text: item.text?.text ?? null,
                imageUrl: item.image?.image.url ?? null,
            })),
            characterMessages: (res.character_messages ?? []).map(item => ({
                messageId: item.message_id,
                msgType: item.msg_type,
                direction: item.msg_direction,
                text: item.text?.text ?? null,
                imageUrl: item.image?.image.url ?? null,
            })),
        });
    }

    #upsertMessageFromApiInfo(
        characterInfo: CharacterTypes.FrozenCharacterInfo,
        apiInfo: ApiTypes.Protocol.PhoneMessageOutput,
    ) {
        const id = apiInfo.message_id ?? '';

        this.#logUnexpectedMessageType('history', apiInfo);

        const msgInfo = this.#messageDataStore.get(id);

        const info: CharacterTypes.MessageInfo = {
            id,
            characterInfo,
            isLocal: false,
            fromMe:
                apiInfo.msg_direction ===
                CharacterEnums.MessageApiDirection.user,
            kind:
                apiInfo.msg_direction ===
                CharacterEnums.MessageApiDirection.system
                    ? CharacterEnums.MessageItemKind.SysMsg
                    : apiInfo.msg_type === CharacterEnums.MessageApiKind.text // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                      ? CharacterEnums.MessageItemKind.Msg
                      : apiInfo.msg_type === CharacterEnums.MessageApiKind.voice // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                        ? CharacterEnums.MessageItemKind.Voice
                        : apiInfo.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                            CharacterEnums.MessageApiKind.image
                          ? CharacterEnums.MessageItemKind.Image
                          : apiInfo.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                              CharacterEnums.MessageApiKind.gift
                            ? CharacterEnums.MessageItemKind.GiveGift
                            : apiInfo.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                                CharacterEnums.MessageApiKind.emoji
                              ? CharacterEnums.MessageItemKind.Meme
                              : apiInfo.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                                  CharacterEnums.MessageApiKind.invitation
                                ? CharacterEnums.MessageItemKind.PlotEvent
                                : apiInfo.msg_type === // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                                    CharacterEnums.MessageApiKind.link
                                  ? CharacterEnums.MessageItemKind.Link
                                  : CharacterEnums.MessageItemKind.Msg,

            state: this.#createMessageState({
                content: apiInfo.text?.text ?? '',

                memeId: apiInfo.emoji?.emoji_id ?? null,

                image:
                    apiInfo.emoji?.emoji_id != null
                        ? FileUtils.getImageInfoFromApiInfo(apiInfo.emoji.media)
                        : FileUtils.getImageInfoFromApiInfo(
                              apiInfo.image?.image,
                          ),

                audio: apiInfo.voice?.voice && {
                    source: apiInfo.voice.voice.url,
                    durationMS: apiInfo.voice.voice.duration ?? null,
                    text: apiInfo.voice.text ?? '',
                },

                invitation: apiInfo.invitation && {
                    title: apiInfo.invitation.title ?? '',
                    desc: apiInfo.invitation.description ?? '',
                    buttonLabel: apiInfo.invitation.button_label ?? '',
                    status: apiInfo.invitation.status,
                    location: apiInfo.invitation.location,
                    figureId: apiInfo.invitation.emotion,
                    skinId: apiInfo.invitation.outfit,
                },

                link: apiInfo.html_file && {
                    title: apiInfo.html_file.html_file.name ?? '',
                    desc: apiInfo.html_file.html_file.text ?? '',
                    url: apiInfo.html_file.html_file.url,
                },

                gift: undefined,

                readed: apiInfo.is_read ?? false,
                clicked: apiInfo.is_click ?? false,

                timestamp:
                    apiInfo.created_at != null
                        ? new Date(apiInfo.created_at)
                        : new Date(),

                status: {
                    sendCode: apiInfo.is_failed ? 'error' : 'success',
                    isAccept: false,
                },

                showAudioContent: !!msgInfo?.state.showAudioContent,
            }),
        };

        const result = this.#messageDataStore.upsert(info);

        this.#updateCharacterLastMessage(result);

        return result;
    }
    //#endregion

    //#region create api info
    #createApiCharacterBaseInfo(
        data: CharacterTypes.FrozenCharacterInfo,
    ): ApiTypes.Protocol.CharacterBasicInfo {
        return {
            name: data.state.name,
            aka: data.state.honorary,

            is_public: data.state.isPublic,

            gender: this.getApiGender(data.state.gender),
            species: data.state.species?.name,
            custom_relation: {
                to_character_name: '',
                relation_name: data.state.relation?.title ?? '',
                impression_to_user: data.state.relation?.regard,
            },

            voice: {
                voice_id: data.state.currentTimbreId ?? undefined,
            },

            profile: data.state.desc,

            recognize_others: true,
        };
    }
    //#endregion

    protected override getInitialInternalState(): InternalState {
        return {
            otherSpeciesList: [],
            menuCustomSpeciesList: [],
            defaultConfig: null,
            waitCharacterOpeningLoadingTextList: [],
            waitCharacterSoulLoadingTextList: [],
        };
    }

    //#region CustomSpecies
    public readonly pushMenuCustomSpecies = (name: string) => {
        const newOne: CharacterTypes.Species = {
            id: name,
            name,
        };
        this.internal.menuCustomSpeciesList = [
            ...this.internal.menuCustomSpeciesList,
            newOne,
        ];
        return newOne;
    };

    public readonly deleteMenuCustomSpecies = (
        id: CharacterTypes.Species['id'],
    ) => {
        this.internal.menuCustomSpeciesList = ArrayUtils.toDeleteItem(
            this.internal.menuCustomSpeciesList,
            this.internal.menuCustomSpeciesList.findIndex(
                item => item.id === id,
            ),
        );
    };

    public readonly updateMenuCustomSpeciesList = (
        speciesList: LibTypes.Arr<CharacterTypes.Species>,
    ) => {
        this.internal.menuCustomSpeciesList = speciesList;
    };
    //#endregion

    //#region utils
    public readonly updateCharacterLastMessage = async (
        characterId: string,
        msgId: string | null,
    ) => {
        const msgItem =
            msgId == null ? null : this.#messageDataStore.get(msgId);
        if (msgItem) {
            await this.#updateCharacterLastMessage(msgItem, true);
        } else {
            await this.#characterDataStore.setState(
                characterId,
                'behavior',
                prevValue => ({
                    ...prevValue,
                    lastMessage: null,
                }),
            );
        }
    };

    public readonly getGender = (apiGender: LibTypes.Nullable<string>) =>
        apiGender == null
            ? null
            : apiGender === CharacterEnums.ApiGender.Boy // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
              ? CharacterEnums.Gender.Boy
              : apiGender === CharacterEnums.ApiGender.Girl // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                ? CharacterEnums.Gender.Girl
                : CharacterEnums.Gender.Other;

    public readonly getApiGender = (
        apiGender: LibTypes.Nullable<CharacterEnums.Gender>,
    ) =>
        apiGender === CharacterEnums.Gender.Boy
            ? CharacterEnums.ApiGender.Boy
            : apiGender === CharacterEnums.Gender.Girl
              ? CharacterEnums.ApiGender.Girl
              : CharacterEnums.ApiGender.Other;
    //#endregion

    //#region create
    public readonly createNewCharacter = (
        options: LibTypes.Define<{
            fromScript?: boolean,
        }> = {},
    ) => {
        const { fromScript } = options;

        const state: CharacterTypes.CharacterState = this.#createCharacterState(
            {
                name: '',
                honorary: '',
                isPublic: true,
                initial: null,
                gender: null,
                species: null,
                relation: Settings.fallbackRelation,
                desc: '',
                figureLib: {},
                currentFigureSkinId: null,
                currentFigureId: null,

                currentViewFigureId: null,

                currentTimbreId: null,
                timbres: [],

                author: this.#userController.state.loggedInUser
                    ? {
                          id: this.#userController.state.loggedInUser.id,
                          name: this.#userController.state.loggedInUser.state
                              .nickname,
                      }
                    : null,

                behavior: this.#createNewBehavior(),

                defaultFigureSkin: null,
                stats: null,
                relationships: null,
                isMe: false,
            },
        );

        const data = this.#characterDataStore.create({
            id: `${this.#id--}`,
            isLocal: true,
            state,
            fromScript: !!fromScript,
        });

        this.watch(
            () => this.internal.defaultConfig,
            (defaultConfig, _, unwatch) => {
                if (defaultConfig) {
                    unwatch();
                    this.#characterDataStore.setState(data.id, 'initial', {
                        abilities: cloneDeep(defaultConfig.initialAbilityList),
                        artStyle: defaultConfig.artStyleList[0] ?? null,
                        evaluation: null,
                    });

                    this.#characterDataStore.setState(
                        data.id,
                        'species',
                        defaultConfig.speciesList[0] ?? null,
                    );
                }
            },
            {
                immediate: true,
            },
        );

        return data;
    };

    public readonly createNewMessage = (
        id: CharacterTypes.CharacterId,
        kind: CharacterEnums.MessageItemKind,
        msgState: Partial<
            LibTypes.DefinePick<
                CharacterTypes.InitialMessageState,
                'audio' | 'content' | 'image' | 'memeId'
            >
        >,
        sending = false,
    ) => {
        const characterInfo = this.#characterDataStore.get(id);

        if (characterInfo) {
            const state = this.#createMessageState({
                content: msgState.content ?? '',
                memeId: msgState.memeId,
                image: msgState.image,
                audio: msgState.audio,

                invitation: null,
                gift: null,
                link: null,

                timestamp: new Date(),

                readed: true,
                clicked: false,
                showAudioContent: false,

                status: {
                    sendCode: sending ? 'sending' : 'success',
                    isAccept: false,
                },
            });

            const info: CharacterTypes.MessageInfo = {
                id: `${this.#msgId--}`,
                isLocal: true,
                kind,
                fromMe: true,
                state,
                characterInfo,
            };

            return this.#messageDataStore.create(info);
        }

        return null;
    };
    //#endregion

    //#region update
    public readonly upsertFormApiInfo = async (
        apiInfo: CharacterTypes.ApiCharacterInfo,
        isLocal: boolean,
    ) => {
        const id = apiInfo.character_id;

        const currentInfo = this.#characterDataStore.get(id);

        const info: CharacterTypes.CharacterInfo = {
            id: apiInfo.character_id,
            isLocal,
            state: this.#createCharacterStateFromApiInfo(apiInfo),
            fromScript:
                apiInfo.create_source == null
                    ? !!currentInfo?.fromScript
                    : apiInfo.create_source === 'script',
        };

        return this.#characterDataStore.upsert(info);
    };

    public readonly updateDefaultFigureSkinByApiMedia = async (
        id: CharacterTypes.CharacterId,
        image: ApiTypes.Protocol.Media,
        backgroundColor: string | null = null,
    ) => {
        await this.updateDefaultFigureSkin(
            id,
            this.#fileService.createImageResource(
                image.id,
                FileUtils.getImageInfoFromApiInfo(image),
            ),
            backgroundColor,
        );
    };

    public readonly updateDefaultFigureSkin = async (
        id: CharacterTypes.CharacterId,
        image: FileTypes.ImageResource,
        backgroundColor: string | null = null,
    ) => {
        await this.#characterDataStore.setState(id, 'defaultFigureSkin', {
            id: Settings.defaultFigureSkinId,
            name: '',
            backgroundColor,
            figures: [
                {
                    id: Settings.defaultFigureId,
                    name: '',
                    isDefault: true,
                    visual: image,
                },
            ],
        });
    };

    public readonly updateFigure = async (
        id: CharacterTypes.CharacterId,
        skinId: string,
        figureId: string,
        image: FileTypes.ImageResource,
    ) => {
        const data = this.#characterDataStore.get(id);
        if (data) {
            const figureLib = {
                ...data.state.figureLib,
            };

            if (figureLib[skinId]) {
                const skin = {
                    ...figureLib[skinId],
                };
                const figures: LibTypes.Arr<CharacterTypes.Figure> = [
                    ...skin.figures,
                ];

                const index = figures.findIndex(item => item.id === figureId);
                if (figures[index]) {
                    figures[index].visual = image;

                    skin.figures = figures;

                    figureLib[skinId] = skin;

                    await this.#characterDataStore.setState(
                        id,
                        'figureLib',
                        figureLib,
                    );
                }
            }
        }
    };

    public readonly updateInitialAbilityPercent = async (
        characterId: CharacterTypes.CharacterId,
        initialAbilityId: string,
        percent: number,
    ) => {
        const character = this.#characterDataStore.get(characterId);
        if (!character?.state.initial?.abilities) {
            return;
        }

        const abilities: LibTypes.Arr<CharacterTypes.InitialAbility> = [
            ...character.state.initial.abilities,
        ];

        const ability = abilities.find(item => item.id === initialAbilityId);
        if (ability) {
            ability.percent = percent;
            await this.#characterDataStore.setState(
                characterId,
                'initial',
                prevValue =>
                    prevValue && {
                        ...prevValue,
                        abilities,
                    },
            );
        }
    };

    //#endregion

    //#region request
    public readonly requestDefaultConfig = async () => {
        const res = await this.#apiService.call.character.body_config();
        const defaultConfig: CharacterTypes.DefaultConfig = {
            initialAbilityList: res.soul_words.map((item, idx) => ({
                id: idx.toString(),
                name: item.soul_word,
                colors: {
                    start: item.center_color,
                    transition: item.transition_color,
                    end: item.edge_color,
                },
                lottie: {
                    uri: item.emotion_resource_url ?? '',
                    width: 0,
                    height: 0,
                },
                percent: 0,
            })),
            speciesList: ArrayUtils.toDeduplicate(res.species).map(item => ({
                id: item,
                name: item,
            })),
            artStyleList: res.art_styles.map((item, idx) => ({
                id: idx.toString(),
                name: item.style_name,
                icon: {
                    uri: item.style_icon.url,
                    width: item.style_icon.width ?? 0,
                    height: item.style_icon.height ?? 0,
                },
            })),
            searchTagList: res.search_tags.map((item, idx) => ({
                id: idx.toString(),
                name: item.name,
                value: item.value,
            })),
        };

        this.internal.defaultConfig = defaultConfig;

        return defaultConfig;
    };

    public readonly requestTimbres = async (
        data: CharacterTypes.FrozenCharacterInfo,
    ) => {
        const res = await this.#apiService.call.character.list_character_voices(
            {
                species: data.state.species?.name ?? undefined,
                gender: this.getApiGender(data.state.gender),
                limit: Settings.timbresLimit,
            },
        );

        const currentTimbre = data.state.currentTimbre;
        const timbres = res.voices.map(item =>
            this.#createTimbreFromApiInfo(item));

        if (
            currentTimbre &&
            !timbres.find(item => item.id === currentTimbre.id)
        ) {
            timbres.push(currentTimbre);
        }

        await this.#characterDataStore.setState(data.id, 'timbres', timbres);
    };

    public readonly requestCharacterInfo = async (
        id: CharacterTypes.CharacterId,
    ) => {
        try {
            const res = await this.#apiService.call.character.detail({
                character_id: id,
            });
            const info = await this.upsertFormApiInfo(res.character, false);
            return info;
        } catch {
            return null;
        }
    };

    public readonly requestAddRoleList = async (
        options: LibTypes.FrozenDefine<{
            keyword?: string,
            cursor?: string,
        }>,
    ) => {
        const { keyword, cursor } = options;
        const res =
            await this.#apiService.call.script.list_selectable_characters({
                query: keyword ?? '',
                cursor,
                limit: Settings.defaultLimit,
            });

        const ids = await Promise.all(
            res.lists.map(async item => {
                const data = await this.upsertFormApiInfo(item, false);
                item.image &&
                    this.updateDefaultFigureSkinByApiMedia(
                        data.id,
                        item.image,
                        item.bkg_main_color ?? null,
                    );
                return item.character_id;
            }),
        );

        return {
            characterIds: ids,
            nextCursor: res.next_cursor,
            hasMore: res.has_more,
        };
    };

    public readonly requestMyList = async () => {
        const res = await this.#apiService.call.character.list_my_characters();

        const ids = await Promise.all(
            res.characters.map(async item => {
                const data = await this.upsertFormApiInfo(
                    item.basic_info,
                    false,
                );

                this.#characterDataStore.setState(
                    data.id,
                    'behavior',
                    prevValue => ({
                        ...prevValue,
                        location: item.character_status.character_loc ?? null,
                        status: item.character_status.character_state ?? null,
                        backgroundColor:
                            item.character_status.bkg_main_color ?? null,
                        currentFigureVisual: item.character_status
                            .current_appearance_media
                            ? this.#fileService.createImageResource(
                                  item.character_status.current_appearance_media
                                      .id,
                                  FileUtils.getImageInfoFromApiInfo(
                                      item.character_status
                                          .current_appearance_media,
                                  ),
                              )
                            : null,
                        backgroundImage: item.character_status.character_loc_bkg
                            ? this.#fileService.createImageResource(
                                  item.character_status.character_loc_bkg.id,
                                  FileUtils.getImageInfoFromApiInfo(
                                      item.character_status.character_loc_bkg,
                                  ),
                              )
                            : null,

                        newMessageCount: item.unread_count,
                    }),
                );

                item.latest_message &&
                    this.#upsertMessageFromApiInfo(data, item.latest_message);

                return item.basic_info.character_id;
            }),
        );

        this.#userController.setMyCharacterList(ids);
    };

    public readonly requestSoulsEvaluation = async (
        abilities: LibTypes.Arr<
            LibTypes.FrozenPick<
                CharacterTypes.InitialAbility,
                'name' | 'percent'
            >
        >,
    ) => {
        const res =
            await this.#apiService.call.character.get_soul_word_evaluation({
                abilities: abilities.map(
                    item =>
                        ({
                            ability_name: item.name,
                            ability_value: Math.round(item.percent),
                        }) satisfies ApiTypes.Protocol.SoulWordAbilityInput,
                ),
            });

        return res.evaluation;
    };

    public readonly requestSchedules = async (
        id: CharacterTypes.CharacterId,
        date: Date,
    ) => {
        const data = this.#characterDataStore.get(id);

        if (data) {
            const res =
                await this.#apiService.call.character.list_schedule_by_day({
                    character_id: id,
                    current_time: date.getTime().toString(),
                });

            const ids = res.schedules.map(item => {
                const info = this.#scheduleDataStore.upsert({
                    id: item.schedule_id,
                    isLocal: false,
                    state: {
                        name: item.schedule_name ?? '',
                        detail: item.detail ?? '',
                        location: item.character_loc ?? '',
                        status: item.character_state ?? '',
                        start: new Date(item.schedule_start_time ?? ''),
                        end: new Date(item.schedule_end_time ?? ''),
                        readed: !!item.viewed,
                    },
                    characterInfo: data,
                });

                return info.id;
            });

            return ids;
        }

        return null;
    };

    public readonly requestScheduleViewStatus = async (id: string) => {
        await this.#apiService.call.character.update_schedule_viewed_status({
            schedule_ids: [id],
            view_status: true,
        });
    };

    public readonly requestGenerateFromSoul = async (
        data: CharacterTypes.FrozenCharacterInfo,
    ) => {
        const res = await this.#apiService.call.character.gen_from_soul(
            {
                body_config: {
                    soul_word_configs:
                        data.state.initial?.abilities?.map(
                            item =>
                                ({
                                    soul_word: item.name,
                                    word_type: 1,
                                    strength: Math.round(item.percent),
                                }) satisfies ApiTypes.Protocol.SoulWordConfig,
                        ) ?? [],
                    gender: this.getApiGender(data.state.gender),
                    species: data.state.species?.name ?? '',
                    custom_relation:
                        (data.state.relation && {
                            relation_name: data.state.relation.title,
                            impression_to_user: data.state.relation.regard,
                        }) ??
                        undefined,
                    style_name: data.state.initial?.artStyle?.name ?? '',
                    anything_to_add: data.state.desc,
                },
            },
            { isLongTask: true },
        );

        const info = await this.upsertFormApiInfo(
            {
                character_id: `${this.#id--}`,
                ...res.character.basic_info,
            },
            true,
        );

        res.character.image_show &&
            this.updateDefaultFigureSkinByApiMedia(
                info.id,
                res.character.image_show,
                res.character.bkg_main_color ?? null,
            );

        return info;
    };

    public readonly requestCreate = async (
        data: CharacterTypes.FrozenCharacterInfo,
    ) => {
        const res = await this.#apiService.call.character.create(
            {
                character: {
                    basic_info: this.#createApiCharacterBaseInfo(data),
                    image_upload: {
                        bucket_name: '',
                        object_key: '',
                        object_type: '',
                        url:
                            data.state.defaultFigure?.visual.remote?.uri ??
                            data.state.defaultFigure?.visual.uri,
                        request_id: '',
                    },
                },
                source_character_id: data.isLocal ? undefined : data.id,
                source: data.fromScript ? 'script' : 'character',
            },
            { isLongTask: true },
        );

        await this.requestCharacterInfo(res.character_id);

        return {
            id: res.character_id,
            openingId: res.opening_log_id,
        };
    };

    public readonly requestMessageList = async (
        id: CharacterTypes.CharacterId,
        direction: ApiTypes.Protocol.ListCharacterPhoneChatHistoryReq['direction'] & {},
        cursor: string | null,
    ) => {
        const data = this.#characterDataStore.get(id);

        if (data) {
            const res =
                await this.#apiService.call.character.list_phone_chat_history({
                    character_id: id,
                    direction,
                    cursor: cursor ?? undefined,
                    limit: Settings.msgLimit,
                });

            const list = res.msgs.map(item => {
                const info = this.#upsertMessageFromApiInfo(data, item);
                return info.id;
            });

            return {
                ids: list,
                upCursor: res.min_cursor,
                downCursor: res.max_cursor,
                upHasMore: res.up_has_more,
                downHasMore: res.down_has_more,
            };
        }

        return null;
    };

    public readonly requestSendMsg = async (
        characterId: CharacterTypes.CharacterId,
        newMsgs: LibTypes.VarArr<CharacterTypes.MessageInput>,
        resendMessageId: LibTypes.Nullable<string>,
        scene: CharacterEnums.MessageApiChatScene = CharacterEnums
            .MessageApiChatScene.phone,
    ) => {
        try {
            const data = this.#characterDataStore.get(characterId);
            if (data) {
                const resendItem =
                    resendMessageId == null
                        ? null
                        : this.#messageDataStore.get(resendMessageId);

                const res =
                    await this.#apiService.call.character.chat_with_character(
                        {
                            character_id: characterId,
                            messages: newMsgs,
                            chat_scene: scene,
                            resend_message_id: resendItem?.isLocal
                                ? undefined
                                : resendItem?.id,
                        },
                        { timeoutMS: Settings.chatTimeoutMS },
                    );

                this.#logChatPayload(
                    {
                        character_id: characterId,
                        messages: newMsgs,
                        chat_scene: scene,
                        resend_message_id: resendItem?.isLocal
                            ? undefined
                            : resendItem?.id,
                    },
                    res,
                );

                const currentList = res.current_messages
                    .map((item, index) => {
                        const newMsg = newMsgs[index];
                        const localMsg =
                            newMsg && this.#messageDataStore.get(newMsg.id);
                        if (localMsg) {
                            const info = this.#messageDataStore.upsert({
                                id: item.message_id ?? '',
                                isLocal: false,
                                kind: localMsg.kind,
                                fromMe: true,
                                state: cloneDeep(localMsg.state),
                                characterInfo: data,
                            });

                            this.#messageDataStore.setState(
                                info.id,
                                'timestamp',
                                item.created_at == null
                                    ? new Date()
                                    : new Date(item.created_at),
                            );

                            this.#messageDataStore.setState(
                                info.id,
                                'status',
                                prevValue => ({
                                    ...prevValue,
                                    sendCode: item.is_failed
                                        ? 'error'
                                        : 'success',
                                }),
                            );

                            return info;
                        }

                        return null;
                    })
                    .filter(item => !!item);

                const characterList =
                    res.character_messages?.map(item => {
                        this.#logUnexpectedMessageType('chat', item);
                        const info = this.#upsertMessageFromApiInfo(data, item);

                        return info;
                    }) ?? [];

                return {
                    currentList,
                    characterList,
                    characterStatus: res.character_status,
                };
            }

            return null;
        } catch {
            newMsgs.forEach(item => {
                this.#messageDataStore.setState(
                    item.id,
                    'status',
                    prevValue => ({
                        ...prevValue,
                        sendCode: 'error',
                    }),
                );
            });

            return null;
        }
    };

    public readonly requestDelete = async (id: string) => {
        await this.#apiService.call.character.delete({
            character_id: id,
        });
        await this.#characterDataStore.delete(id);
    };

    public readonly requestMsgRollback = async (
        characterId: CharacterTypes.CharacterId,
        msgId: string,
    ) => {
        await this.#apiService.call.character.memory_rollback(
            {
                character_id: characterId,
                msg_id: msgId,
            },
            { isLongTask: true },
        );
    };

    public readonly requestCopyableList = async (
        options: LibTypes.Define<{
            keyword?: string,
            tag?: number,
            cursor?: string,
        }>,
    ) => {
        const { tag, keyword, cursor } = options;
        const res =
            await this.#apiService.call.character.list_copyable_characters({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                tag: tag as ApiTypes.Protocol.ListCopyableCharactersReq['tag'],
                keyword,
                cursor,
                limit: Settings.defaultLimit,
            });

        const ids = await Promise.all(
            res.characters.map(async item => {
                const data = await this.upsertFormApiInfo(item, false);
                item.image &&
                    this.updateDefaultFigureSkinByApiMedia(
                        data.id,
                        item.image,
                        item.bkg_main_color ?? null,
                    );
                return data.id;
            }),
        );

        return {
            characterIds: ids,
            nextCursor: res.next_cursor,
            hasMore: res.has_more,
        };
    };
    //#endregion
}
