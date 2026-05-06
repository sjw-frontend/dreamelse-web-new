// @ts-nocheck
import { debounce } from 'lodash';

import type {
    ChatInputController,
    ChatInputMemeItem,
    DramatizeEngineController,
    SendVoiceMessageResult,
} from '$/component-controllers';
import { APP } from '$/consts';
import {
    AppController,
    CharacterController,
    RouterController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { CharacterEnums, FileEnums, RouterEnums } from '$/enums';
import { ApiService, DeviceService, FileService } from '$/services';
import type { CharacterTypes, FileTypes } from '$/types';
import {
    ArrayUtils,
    FetchUtils,
    FileUtils,
    MathUtils,
    StringUtils,
    TaskUtils,
    TimerUtils,
    TosUtils,
} from '$/utils';

import { getCharacterInfoFromRoute } from '../@com';

import { Settings } from './character-interaction-const';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo | null,
    msgIds: LibTypes.Arr<CharacterTypes.MessageInfo['id']>,

    newCharacterMsgIds: LibTypes.VarArr<CharacterTypes.MessageInfo['id']>,
    characterMsgProcessing: boolean,

    atMsgHead: boolean,

    chatExpanded: boolean,
    controlChatEnabled: boolean,
    get chatEnabled(): boolean,

    upCursor: string | null,
    upHasMore: boolean,

    downCursor: string | null,
    downHasMore: boolean,

    invitationId: string | null,
    invitationMsgId: string | null,

    sendMsgList: LibTypes.VarArr<CharacterTypes.MessageInput>,

    showLoading: boolean,

    characterWriting: boolean,

    speed: number,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'atMsgHead'
    | 'characterWriting'
    | 'chatEnabled'
    | 'chatExpanded'
    | 'data'
    | 'msgIds'
    | 'showLoading'
    | 'speed'
>;

type EventMap = LibTypes.FrozenDefine<{
    playInvitationError: LibTypes.SimpleFunction,
    playInvitationEnd: LibTypes.SimpleFunction,
    scrollToMsgListHead: LibTypes.SimpleFunction,
}>;

type Context = LibTypes.VarDefine<{
    playNextCursor: string | null,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    dramatizeEngineCtrl?: DramatizeEngineController | null,
    chatInputCtrl: ChatInputController,
}>;

@renderController()
export class CharacterInteractionController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        appController: AppController,
        routerController: RouterController,
        characterController: CharacterController,
        apiService: ApiService,
        deviceService: DeviceService,
        fileService: FileService,
    ) {
        super();
        this.#routerController = routerController;
        this.#characterController = characterController;
        this.#appController = appController;
        this.#apiService = apiService;
        this.#deviceService = deviceService;
        this.#fileService = fileService;

        this.#watch();
        this.#init();
    }

    readonly #appController;
    readonly #routerController;
    readonly #characterController;
    readonly #apiService;
    readonly #deviceService;
    readonly #fileService;

    readonly #ctx: Context = {
        playNextCursor: null,
    };

    #nextInputTimer: LibTypes.TimerHandle | null = null;
    #taskTimer: LibTypes.TimerHandle | null = null;

    #writingTimer: LibTypes.TimerHandle | null = null;

    #dequeueCharacterTimer: LibTypes.TimerHandle | null = null;

    #relatedControllers?: RelatedControllers;

    readonly #newInput = debounce(() => {
        this.#clearInput();
        if (
            this.internal.chatExpanded &&
            this.internal.sendMsgList.length > 0
        ) {
            this.#nextInputTimer = setTimeout(() => {
                this.#batchSendMsgs();
            }, this.#createNextInputTimoutMS());
        }
    });

    readonly #requestMessageList = TaskUtils.createMergeTask(
        async (direction: 'down' | 'up') => {
            if (this.internal.data) {
                if (direction === 'up' && !this.internal.upHasMore) {
                    return;
                }

                const res = await this.#characterController.requestMessageList(
                    this.internal.data.id,
                    direction,
                    direction === 'up'
                        ? this.internal.upCursor
                        : this.internal.downCursor,
                );

                if (res) {
                    if (direction === 'up') {
                        this.internal.msgIds = ArrayUtils.toDeduplicate([
                            ...res.ids,
                            ...this.internal.msgIds,
                        ]);
                    } else {
                        this.internal.msgIds = ArrayUtils.toDeduplicate([
                            ...this.internal.msgIds,
                            ...res.ids,
                        ]);
                    }
                    this.internal.upCursor = res.upCursor;
                    this.internal.upHasMore = res.upHasMore;
                    this.internal.downCursor = res.downCursor;
                    this.internal.downHasMore = res.downHasMore;
                }
            }
        },
    );

    #dequeueCharacterMsgIds() {
        if (this.internal.data) {
            this.internal.characterMsgProcessing = true;

            const newId = this.internal.newCharacterMsgIds.shift();
            const nextId = this.internal.newCharacterMsgIds[0];

            if (newId != null) {
                this.internal.msgIds = ArrayUtils.toDeduplicate([
                    ...this.internal.msgIds,
                    newId,
                ]);
            }

            if (nextId != null) {
                const msg = this.#characterController.getMessage(nextId);
                if (msg) {
                    if (msg.kind === CharacterEnums.MessageItemKind.Msg) {
                        this.#dequeueCharacterTimer = setTimeout(() => {
                            this.#dequeueCharacterMsgIds();
                        }, Settings.textMsgDequeueIntervalForWord * msg.state.content.length);
                    } else if (
                        msg.kind === CharacterEnums.MessageItemKind.Voice
                    ) {
                        this.#dequeueCharacterTimer = setTimeout(
                            () => {
                                this.#dequeueCharacterMsgIds();
                            },
                            (msg.state.audio?.durationMS ?? 0) +
                                Settings.baseVoiceMsgDequeueInterval,
                        );
                    } else {
                        this.#dequeueCharacterTimer = setTimeout(() => {
                            this.#dequeueCharacterMsgIds();
                        }, Settings.otherMsgDequeueInterval);
                    }
                }
            } else {
                this.internal.characterMsgProcessing = false;
                this.watch(
                    () => this.internal.sendMsgList.length === 0,
                    (value, _, unwatch) => {
                        if (value) {
                            unwatch();
                            if (this.internal.newCharacterMsgIds.length === 0) {
                                this.#clearWriting();
                            }
                        }
                    },
                    {
                        immediate: true,
                    },
                );
            }
        }
    }

    #clearWriting() {
        clearTimeout(this.#writingTimer);
        this.#writingTimer = null;
        this.internal.characterWriting = false;
    }

    #createNextInputTimoutMS() {
        return TimerUtils.getRandomIntervalMS(
            Settings.inputInterval.start,
            Settings.inputInterval.end,
        );
    }

    #createShowWritingDelayMS() {
        return TimerUtils.getRandomIntervalMS(
            Settings.showWritingDelayMS.start,
            Settings.showWritingDelayMS.end,
        );
    }

    #watch() {
        this.watch(
            () => this.internal.newCharacterMsgIds,
            newCharacterMsgIds => {
                if (newCharacterMsgIds.length > 0) {
                    if (!this.internal.characterMsgProcessing) {
                        this.#dequeueCharacterMsgIds();
                    }
                }
            },
        );

        this.watch(
            () =>
                !this.#appController.state.active ||
                this.internal.unmounted === true ||
                !this.internal.chatExpanded,
            value => {
                if (value) {
                    this.#clearWriting();
                    this.#batchSendMsgs();
                }
            },
        );

        this.watch(
            () => this.internal.chatExpanded,
            chatExpanded => {
                if (!chatExpanded) {
                    this.#relatedControllers?.chatInputCtrl.hidePanel();
                    this.#relatedControllers?.chatInputCtrl.setTextInputFocused(
                        false,
                    );
                }
            },
        );

        this.watch(
            () => this.internal.msgIds.at(-1),
            id => {
                if (this.internal.data && id != null) {
                    const msgItem = this.#characterController.getMessage(id);
                    if (
                        msgItem &&
                        !msgItem.fromMe &&
                        this.internal.routeFocused === true &&
                        this.internal.mounted &&
                        !this.internal.unmounted &&
                        this.internal.chatExpanded
                    ) {
                        this.#characterController.setCharacterState(
                            this.internal.data.id,
                            'behavior',
                            prevValue => ({
                                ...prevValue,
                                newMessageCount: 0,
                            }),
                        );

                        this.#apiService.call.character.update_message_read_status(
                            {
                                character_id: this.internal.data.id,
                                msg_id: id,
                                is_read: true,
                            },
                        );

                        this.internal.msgIds.forEach(msgId => {
                            this.internal.data &&
                                this.#characterController.setMessageState(
                                    msgId,
                                    'readed',
                                    true,
                                );
                        });
                    }
                }
            },
        );
    }

    #init() {
        this.internal.data = getCharacterInfoFromRoute(
            this.internal.route,
            this.#characterController,
        );

        this.#requestMessageList('down');
    }

    #upsert(msg: CharacterTypes.FrozenMessageInfo) {
        this.internal.msgIds = ArrayUtils.toDeduplicate([
            ...this.internal.msgIds,
            msg.id,
        ]);
    }

    #clearTask() {
        clearTimeout(this.#taskTimer);
        this.#clearInput();
    }

    #clearInput() {
        clearTimeout(this.#nextInputTimer);
    }

    #clearAllTimer() {
        this.#clearTask();
        this.#clearWriting();
        clearTimeout(this.#dequeueCharacterTimer);
    }

    #newTask() {
        this.#clearTask();
        if (
            this.internal.chatExpanded &&
            this.internal.sendMsgList.length === 0
        ) {
            this.#writingTimer ??= setTimeout(() => {
                this.internal.characterWriting = true;
                this.#writingTimer = null;
            }, this.#createShowWritingDelayMS());

            this.#taskTimer = setTimeout(() => {
                this.#batchSendMsgs();
            }, Settings.taskMaxDelayMS);
        }
    }

    #pushSendMsgs(msg: CharacterTypes.MessageInput, oldMessageId?: string) {
        this.#newTask();
        this.internal.sendMsgList.push(msg);
        if (
            this.internal.sendMsgList.length >= Settings.maxSendMsgLength ||
            oldMessageId != null
        ) {
            this.#batchSendMsgs(oldMessageId);
        } else {
            this.#newInput();
        }
    }

    async #batchSendMsgs(oldMessageId?: string) {
        this.#clearTask();
        if (this.internal.data && this.internal.sendMsgList.length > 0) {
            const list = [...this.internal.sendMsgList];
            this.internal.sendMsgList = [];

            const res = await this.#characterController.requestSendMsg(
                this.internal.data.id,
                list,
                oldMessageId,
            );

            if (res) {
                this.internal.msgIds = this.internal.msgIds.map(id => {
                    const idx = list.findIndex(info => info.id === id);
                    if (idx >= 0) {
                        const newItem = res.currentList[idx];
                        if (newItem) {
                            return newItem.id;
                        }
                    }
                    return id;
                });

                this.internal.newCharacterMsgIds = ArrayUtils.toDeduplicate([
                    ...this.internal.newCharacterMsgIds,
                    ...res.characterList.map(item => item.id),
                ]);

                this.#characterController.setCharacterState(
                    this.internal.data.id,
                    'behavior',
                    prevValue => ({
                        ...prevValue,
                        status:
                            res.characterStatus.character_state ??
                            prevValue.status,
                        location:
                            res.characterStatus.character_loc ??
                            prevValue.location,
                        currentFigureVisual: res.characterStatus
                            .current_appearance_media
                            ? this.#fileService.createImageResource(
                                  res.characterStatus.current_appearance_media
                                      .id,
                                  FileUtils.getImageInfoFromApiInfo(
                                      res.characterStatus
                                          .current_appearance_media,
                                  ),
                              )
                            : prevValue.currentFigureVisual,
                        backgroundColor:
                            res.characterStatus.bkg_main_color ??
                            prevValue.backgroundColor,
                        backgroundImage: res.characterStatus.character_loc_bkg
                            ? this.#fileService.createImageResource(
                                  res.characterStatus.character_loc_bkg.id,
                                  FileUtils.getImageInfoFromApiInfo(
                                      res.characterStatus.character_loc_bkg,
                                  ),
                              )
                            : prevValue.backgroundImage,
                    }),
                );
            } else if (
                this.internal.newCharacterMsgIds.length === 0 &&
                this.internal.sendMsgList.length === 0
            ) {
                this.#clearWriting();
            }
        }
    }

    #msgError(id: string) {
        this.internal.data &&
            this.#characterController.setMessageState(
                id,
                'status',
                prevValue => ({
                    ...prevValue,
                    sendCode: 'error',
                }),
            );
    }

    #deleteMsg(id: string) {
        this.internal.msgIds = this.internal.msgIds.filter(item => item !== id);
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: null,
            msgIds: [],
            newCharacterMsgIds: [],
            characterMsgProcessing: false,

            atMsgHead: false,

            chatExpanded: true,
            controlChatEnabled: false,
            get chatEnabled() {
                return this.chatExpanded || this.controlChatEnabled;
            },

            upCursor: null,
            upHasMore: true,

            downCursor: null,
            downHasMore: true,

            invitationId: null,
            invitationMsgId: null,

            sendMsgList: [],

            showLoading: false,

            characterWriting: false,

            speed: 1,
        };
    }

    // 导航相关
    public readonly goBack = () => {
        this.#routerController.goBack();
    };

    public readonly toSchedule = () => {
        if (this.internal.data) {
            this.#routerController.navigate(
                RouterEnums.RouteName.CharacterSchedule,
                {
                    ids: [this.internal.data.id],
                },
            );
        }
    };

    public readonly toDetails = () => {
        this.internal.data &&
            this.#routerController.navigate(
                RouterEnums.RouteName.CharacterDetails,
                {
                    ids: [this.internal.data.id],
                },
            );
    };

    public readonly togglePanel = (value: boolean) => {
        this.internal.chatExpanded = value;
    };

    public readonly markMessageAsClicked = (
        messageId: string,
        isClick = true,
    ) => {
        if (this.internal.data) {
            const msgItem = this.#characterController.getMessage(messageId);
            if (msgItem) {
                this.#characterController.setMessageState(
                    messageId,
                    'clicked',
                    isClick,
                );
                this.#apiService.call.character.update_message_click_status({
                    character_id: this.internal.data.id,
                    msg_id: messageId,
                    is_click: isClick,
                });
            }
        }
    };

    public readonly sendVoiceMessage = async (
        promise: Promise<SendVoiceMessageResult>,
        oldMessageId?: string,
    ) => {
        try {
            if (!this.internal.data) {
                return;
            }

            const newMessage = this.#characterController.createNewMessage(
                this.internal.data.id,
                CharacterEnums.MessageItemKind.Voice,
                {
                    content: '[语音消息]',
                    audio: { source: null, durationMS: null, text: '' },
                },
                true,
            );

            if (!newMessage) {
                return;
            }

            try {
                this.#upsert(newMessage);

                this.internal.msgIds = ArrayUtils.toDeduplicate([
                    ...this.internal.msgIds,
                    newMessage.id,
                ]);
                // 停止录音并获取录音结果
                const result = await promise;
                if (result) {
                    this.#characterController.setMessageState(
                        newMessage.id,
                        'status',
                        prevValue => ({
                            ...prevValue,
                            sendCode: 'success',
                        }),
                    );

                    this.#characterController.setMessageState(
                        newMessage.id,
                        'audio',
                        prevValue => ({
                            ...prevValue,
                            text: result.text,
                            durationMS: result.audioDurationMS,
                            source: result.audioUri,
                        }),
                    );

                    this.#pushSendMsgs(
                        {
                            id: newMessage.id,
                            msg_type: CharacterEnums.MessageApiKind.voice,
                            voice: {
                                voice: {
                                    id: '',
                                    media_type: 'audio',
                                    url: '',
                                    duration: result.audioDurationMS,
                                },
                                text: result.text,
                            },
                        },
                        oldMessageId,
                    );
                } else {
                    this.#deleteMsg(newMessage.id);
                }
            } catch {
                this.#deleteMsg(newMessage.id);
            }
        } finally {
            this.#newInput();
        }
    };

    public readonly sendMessage = (content: string, oldMessageId?: string) => {
        if (this.internal.data) {
            const newMessage = this.#characterController.createNewMessage(
                this.internal.data.id,
                CharacterEnums.MessageItemKind.Msg,
                {
                    content,
                },
            );

            if (newMessage) {
                this.#upsert(newMessage);
                this.internal.msgIds = ArrayUtils.toDeduplicate([
                    ...this.internal.msgIds,
                    newMessage.id,
                ]);

                this.#pushSendMsgs(
                    {
                        id: newMessage.id,
                        msg_type: CharacterEnums.MessageApiKind.text,
                        text: {
                            text: content,
                        },
                    },
                    oldMessageId,
                );
            }
        } else {
            this.#newInput();
        }
    };

    public readonly sendMemeMessage = (
        meme: ChatInputMemeItem,
        oldMessageId?: string,
    ) => {
        if (!this.internal.data) {
            this.#newInput();
            return;
        }

        const newMessage = this.#characterController.createNewMessage(
            this.internal.data.id,
            CharacterEnums.MessageItemKind.Meme,
            {
                content: '[动画表情]',
                memeId: meme.id,
                image: {
                    uri: meme.imageUrl,
                    width: 200, // TODO 表情默认尺寸
                    height: 200,
                },
            },
        );

        if (newMessage) {
            this.#upsert(newMessage);
            this.internal.msgIds = ArrayUtils.toDeduplicate([
                ...this.internal.msgIds,
                newMessage.id,
            ]);

            this.#pushSendMsgs(
                {
                    id: newMessage.id,
                    msg_type: CharacterEnums.MessageApiKind.emoji,
                    emoji: {
                        emoji_id: meme.id,
                    },
                },
                oldMessageId,
            );
        }
    };

    public readonly sendImageMessage = async (
        img: FileTypes.ImageInfo,
        oldMessageId?: string,
    ) => {
        try {
            if (this.internal.data) {
                const newMessage = this.#characterController.createNewMessage(
                    this.internal.data.id,
                    CharacterEnums.MessageItemKind.Image,
                    {
                        content: '[图片]',
                        image: {
                            uri: img.uri,
                            width: img.width,
                            height: img.height,
                        },
                    },
                );

                if (newMessage) {
                    this.#upsert(newMessage);
                    this.internal.msgIds = ArrayUtils.toDeduplicate([
                        ...this.internal.msgIds,
                        newMessage.id,
                    ]);

                    // 上传图片
                    try {
                        let uri = img.uri;

                        if (!FetchUtils.isHttpLink(uri)) {
                            const authHeaders =
                                await this.#apiService.getAuthHeaders();
                            const bearerToken = authHeaders?.Authorization;
                            if (bearerToken == null) {
                                this.#deleteMsg(newMessage.id);
                                return;
                            }

                            const token = bearerToken.replace(
                                /^Bearer\s+/i,
                                '',
                            );
                            const fileName = FileUtils.createFilenameByUri(
                                img.uri,
                            );
                            const key = `temp/character/${fileName}`;

                            const uploaded = await TosUtils.uploadImageToTos({
                                imageUri: img.uri,
                                origin: APP.ENV.ApiOrigin,
                                token,
                                authorizationScheme: 'bearer',
                                key,
                            });

                            console.info('TOS upload ok', uploaded);

                            uri =
                                uploaded.signedUrl !== ''
                                    ? uploaded.signedUrl
                                    : uploaded.url;
                        }

                        // 更新消息中的图片 URI
                        this.#characterController.setMessageState(
                            newMessage.id,
                            'image',
                            {
                                uri,
                                width: img.width,
                                height: img.height,
                            },
                        );

                        this.#pushSendMsgs(
                            {
                                id: newMessage.id,
                                msg_type: CharacterEnums.MessageApiKind.image,
                                image: {
                                    image: {
                                        id: '',
                                        media_type: 'image',
                                        url: uri,
                                        width: img.width,
                                        height: img.height,
                                    },
                                },
                            },
                            oldMessageId,
                        );
                    } catch (e) {
                        console.error('Image upload or send failed', e);
                        this.#msgError(newMessage.id);
                    }
                }
            }
        } finally {
            this.#newInput();
        }
    };

    public readonly resendMessage = async (messageId: string) => {
        this.#clearInput();
        try {
            if (!this.internal.data) {
                return;
            }
            const msg = this.#characterController.getMessage(messageId);
            if (!msg || !msg.fromMe || !msg.state.isError) {
                return;
            }

            this.internal.msgIds = this.internal.msgIds.filter(
                id => id !== messageId,
            );

            if (msg.kind === CharacterEnums.MessageItemKind.Msg) {
                this.sendMessage(msg.state.content, messageId);
            } else if (msg.kind === CharacterEnums.MessageItemKind.Meme) {
                if (!StringUtils.isEmpty(msg.state.memeId) && msg.state.image) {
                    this.sendMemeMessage(
                        {
                            id: msg.state.memeId,
                            imageUrl: msg.state.image.uri,
                        },
                        messageId,
                    );
                }
            } else if (msg.kind === CharacterEnums.MessageItemKind.Image) {
                if (msg.state.image) {
                    await this.sendImageMessage(
                        {
                            kind: FileEnums.Media.Image,
                            uri: msg.state.image.uri,
                            width: msg.state.image.width,
                            height: msg.state.image.height,
                        },
                        messageId,
                    );
                }
            } else if (msg.kind === CharacterEnums.MessageItemKind.Voice) {
                if (msg.state.audio) {
                    await this.sendVoiceMessage(
                        Promise.resolve({
                            text: msg.state.audio.text,
                            audioUri: msg.state.audio.source ?? null,
                            audioDurationMS: msg.state.audio.durationMS ?? 0,
                        }),
                        messageId,
                    );
                }
            }
        } finally {
            this.#newInput();
        }
    };

    public readonly requestMoreMessagesUp = async () => {
        console.log('requestMoreMessagesUp');
        await this.#requestMessageList('up');
    };

    public readonly setAtMsgHead = (value: boolean) =>
        (this.internal.atMsgHead = value);

    public readonly pressPlotEvent = async (id: string) => {
        const msg = this.#characterController.getMessage(id);

        try {
            if (this.internal.data && !msg?.state.clicked) {
                this.internal.chatExpanded = false;

                this.markMessageAsClicked(id);

                const res =
                    await this.#apiService.call.character.play_invitation(
                        {
                            character_id: this.internal.data.id,
                            message_id: id,
                        },
                        { isLongTask: true },
                    );

                console.log('play_invitation', res);

                this.internal.invitationId = res.invitation_id;
                this.internal.invitationMsgId = id;
            }
        } catch (e) {
            console.error(e);
            this.markMessageAsClicked(id, false);
            this.internal.chatExpanded = true;
            this.emitEvent('playInvitationError');
        }
    };

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        this.#relatedControllers = relatedControllers;
        const { dramatizeEngineCtrl, chatInputCtrl } = relatedControllers;

        const args = dramatizeEngineCtrl
            ? [
                  this.watch(
                      () => dramatizeEngineCtrl.state.speed,
                      speed => (this.internal.speed = speed),
                  ),
                  this.watch(
                      () => dramatizeEngineCtrl.state.isWorldLineEnd,
                      isWorldLineEnd => {
                          if (isWorldLineEnd) {
                              this.emitEvent('playInvitationEnd');
                          }
                      },
                  ),
                  this.watch(
                      () =>
                          dramatizeEngineCtrl.state.isInteractionShow &&
                          !dramatizeEngineCtrl.state.isInteractHandling,
                      controlChatEnabled => {
                          this.internal.controlChatEnabled = controlChatEnabled;
                      },
                      { immediate: true },
                  ),
                  this.watch(
                      () => this.internal.invitationId,
                      invitationId => {
                          if (
                              this.internal.data &&
                              invitationId != null &&
                              this.internal.invitationMsgId != null
                          ) {
                              this.#ctx.playNextCursor = null;
                              const characterId = this.internal.data.id;
                              const invitationMsgId =
                                  this.internal.invitationMsgId;

                              this.internal.showLoading = true;

                              dramatizeEngineCtrl.startPlay({
                                  requestNarrativesCallback: async () => {
                                      const res =
                                          await this.#apiService.call.character.query_invitation(
                                              {
                                                  invitation_id: invitationId,
                                                  next_cursor:
                                                      this.#ctx
                                                          .playNextCursor ??
                                                      undefined,
                                              },
                                              { isLongTask: true },
                                          );

                                      this.#ctx.playNextCursor =
                                          res.next_cursor;

                                      return {
                                          narratives: res.narratives,
                                          resource: res.resource,
                                          hasMore: res.has_more,
                                      };
                                  },
                                  requestContinueCallback: async ({
                                      value,
                                  }) => {
                                      await this.#apiService.call.character.play_invitation(
                                          {
                                              character_id: characterId,
                                              message_id: invitationMsgId,
                                              user_message: value,
                                          },
                                          { isLongTask: true },
                                      );
                                  },
                              });
                              this.internal.invitationId = null;
                              this.internal.invitationMsgId = null;
                          }
                      },
                      {
                          immediate: true,
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
              ]
            : [];

        this.autoClearRelatedControllers(
            chatInputCtrl.addEventListener(
                'sendVoiceMessage',
                async promise => {
                    if (this.internal.chatExpanded) {
                        await this.sendVoiceMessage(promise);
                    } else {
                        chatInputCtrl.setTextInputFocused(false);
                        const result = await promise;
                        if (result && dramatizeEngineCtrl?.state.narrative) {
                            await dramatizeEngineCtrl.interact(
                                dramatizeEngineCtrl.state.narrative.state
                                    .narrativeId,
                                result.text,
                            );
                        }
                    }
                },
            ),
            chatInputCtrl.addEventListener('sendMessage', async content => {
                if (this.internal.chatExpanded) {
                    this.sendMessage(content);
                } else {
                    chatInputCtrl.setTextInputFocused(false);
                    if (dramatizeEngineCtrl?.state.narrative) {
                        await dramatizeEngineCtrl.interact(
                            dramatizeEngineCtrl.state.narrative.state
                                .narrativeId,
                            content,
                        );
                    }
                }
            }),
            chatInputCtrl.addEventListener(
                'sendMemeMessage',
                this.sendMemeMessage,
            ),
            chatInputCtrl.addEventListener(
                'sendImageMessage',
                this.sendImageMessage,
            ),
            this.watch(
                () => chatInputCtrl.state.isRecording,
                isRecording => {
                    if (isRecording) {
                        this.#clearInput();
                    }
                },
            ),
            chatInputCtrl.addEventListener('cancelRecording', () => {
                this.#newInput();
            }),
            this.watch(
                () => chatInputCtrl.state.isPicking,
                isPicking => {
                    if (isPicking) {
                        this.#clearInput();
                    }
                },
            ),
            chatInputCtrl.addEventListener('cancelPickImage', () => {
                this.#newInput();
            }),
            this.watch(
                () => chatInputCtrl.state.inputText,
                () => {
                    this.#newInput();
                },
            ),
            ...args,
        );
    };

    public readonly openLink = (title: string, url: string) => {
        this.#routerController.navigate(RouterEnums.RouteName.Web, {
            title,
            url,
        });
    };

    public readonly copyMsg = (text: string) => {
        this.#deviceService.copyToClipboard(text);
    };

    public readonly msgRollback = async (id: string) => {
        await this.#appController.waitMoment(async () => {
            if (this.internal.data) {
                const index = this.internal.msgIds.findIndex(
                    item => item === id,
                );

                if (index >= 0) {
                    await this.#characterController.requestMsgRollback(
                        this.internal.data.id,
                        id,
                    );

                    const msg = this.#characterController.getMessage(id);

                    if (
                        msg?.kind === CharacterEnums.MessageItemKind.Msg &&
                        !StringUtils.isEmpty(msg.state.content)
                    ) {
                        this.#relatedControllers?.chatInputCtrl.setInputText(
                            msg.state.content,
                        );
                    }

                    this.#clearAllTimer();
                    this.internal.sendMsgList = [];
                    this.internal.newCharacterMsgIds = [];
                    this.internal.msgIds = this.internal.msgIds.slice(0, index);

                    const lastId = this.internal.msgIds.at(-1);
                    this.#characterController.updateCharacterLastMessage(
                        this.internal.data.id,
                        lastId ?? null,
                    );

                    this.emitEvent('scrollToMsgListHead');
                }
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
