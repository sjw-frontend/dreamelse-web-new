import { CharacterEnums } from '$/enums';
import type { ApiTypes, DataStoreTypes, FileTypes, UserTypes } from '$/types';

export declare namespace CharacterTypes {
    type CharacterId = string;

    type CharacterStateGetter = LibTypes.VarDefine<{
        get isOwner(): boolean,
        get currentTimbre(): Timbre | null,
        get currentFigure(): Figure | null,
        get currentFigureSkin(): FigureLibItem | null,
        get currentFigures(): LibTypes.Arr<Figure> | null,
        get defaultFigure(): Figure | null,
        get defaultFigures(): LibTypes.Arr<Figure> | null,

        get currentViewFigure(): Figure | null,
    }>;

    type InitialCharacterState = LibTypes.VarDefine<{
        name: string,
        initial: Initial | null,
        honorary: string,
        isPublic: boolean,
        gender: CharacterEnums.Gender | null,
        species: Species | null, // 物种
        relation: Relationship | null,
        desc: string,
        author: Author | null,

        defaultFigureSkin: FigureLibItem | null,

        timbres: LibTypes.Arr<Timbre>,
        currentTimbreId: string | null,

        figureLib: FigureLib,
        currentFigureSkinId: string | null,
        currentFigureId: string | null,

        currentViewFigureId: string | null,

        behavior: Behavior,
        stats: Stats | null,
        relationships: LibTypes.Arr<Relationship> | null,

        isMe: boolean, // TODO
    }>;

    type CharacterState = LibTypes.VarDefine<
        CharacterStateGetter & InitialCharacterState
    >;

    type CharacterAttrs = LibTypes.VarDefine<{
        readonly fromScript: boolean,
    }>;

    type CharacterInfo = DataStoreTypes.DataItem<
        CharacterState,
        CharacterAttrs
    >;

    type FrozenCharacterInfo = LibTypes.FrozenDefine<CharacterInfo>;
}

export declare namespace CharacterTypes {
    type MessageStateGetter = LibTypes.VarDefine<{
        get isSuccess(): boolean,
        get isError(): boolean,
        get isSending(): boolean,
        get isGiftAccept(): boolean,
    }>;

    type InitialMessageState = LibTypes.VarDefine<{
        content: string,
        memeId: LibTypes.Nullable<string>,
        image: LibTypes.Nullable<FileTypes.SimpleVisual>,
        audio: LibTypes.Nullable<{
            source: FileTypes.Uri | null,
            durationMS: number | null,
            text: string,
        }>,

        invitation: LibTypes.Nullable<{
            title: string,
            desc: string,
            buttonLabel: string,
            status?: string,
            location?: string,
            skinId?: string,
            figureId?: string,
        }>,

        link: LibTypes.Nullable<{
            title: string,
            desc: string,
            url: string,
        }>,

        gift: LibTypes.Nullable<{
            image: FileTypes.SimpleVisual,
            name: string,
            content: string,
            price: number,
        }>,

        timestamp: Date,

        readed: boolean,

        clicked: boolean,
        status: {
            sendCode: 'error' | 'sending' | 'success',
            isAccept: boolean,
        },

        showAudioContent: boolean,
    }>;

    type MessageState = LibTypes.VarDefine<
        InitialMessageState & MessageStateGetter
    >;

    type MessageAttrs = LibTypes.VarDefine<{
        readonly kind: CharacterEnums.MessageItemKind,
        readonly fromMe: boolean,
        readonly characterInfo: FrozenCharacterInfo,
    }>;

    type MessageInfo = DataStoreTypes.DataItem<MessageState, MessageAttrs>;

    type FrozenMessageInfo = LibTypes.FrozenDefine<MessageInfo>;
}

export declare namespace CharacterTypes {
    type ScheduleState = LibTypes.VarDefine<
        LibTypes.FrozenDefine<{
            /** 名称 */
            name: string,
            /** 心情、状态 */
            status: string,
            /** 详情 */
            detail: string,
            /** 服装 */
            // outfit: string,
            /** 地点 */
            location: string,

            start: Date,
            end: Date,

            // expanded: boolean,
            // kind: CharacterEnums.ScheduleItemKind,
        }> & {
            readed: boolean,
        }
    >;

    type ScheduleAttrs = LibTypes.VarDefine<{
        readonly characterInfo: FrozenCharacterInfo,
    }>;

    type ScheduleInfo = DataStoreTypes.DataItem<ScheduleState, ScheduleAttrs>;

    type FrozenScheduleInfo = LibTypes.FrozenDefine<ScheduleInfo>;
}

export declare namespace CharacterTypes {
    type ApiCharacterInfo = LibTypes.SetRequired<
        Partial<
            ApiTypes.Protocol.CharacterDetailInfo &
                LibTypes.FrozenPick<
                    ApiTypes.Protocol.CharacterShowInfo,
                    'create_source'
                >
        >,
        'character_id'
    >;

    type Initial = LibTypes.VarDefine<{
        artStyle: ArtStyle | null,
        abilities: LibTypes.Arr<InitialAbility> | null,
        evaluation: string | null,
    }>;

    type Stats = LibTypes.FrozenDefine<{
        abilityValue: number,
        abilities: LibTypes.Arr<Ability>,
        evaluation: string,
        skills: LibTypes.Arr<Skill>,
    }>;

    type Skill = LibTypes.FrozenDefine<{
        id: string,
        name: string,
        levelText: string,
    }>;

    // TODO
    type Author = LibTypes.FrozenDefine<{
        id: UserTypes.UserId,
        name: string,
    }>;

    type SearchTag = LibTypes.FrozenDefine<{
        id: string,
        name: string,
        value: number,
    }>;

    type DefaultConfig = LibTypes.FrozenDefine<{
        initialAbilityList: LibTypes.Arr<InitialAbility>,
        speciesList: LibTypes.Arr<Species>,
        artStyleList: LibTypes.Arr<ArtStyle>,
        searchTagList: LibTypes.Arr<SearchTag>,
    }>;

    type Relationship = LibTypes.FrozenDefine<{
        characterName: string,
        title: string,
        regard: string,
        weight: number | null,
    }>;

    type Species = LibTypes.FrozenDefine<{
        id: string,
        name: string,
    }>;

    type ArtStyle = LibTypes.FrozenDefine<{
        id: string,
        name: string,
        icon: FileTypes.SimpleVisual,
    }>;

    type Timbre = LibTypes.FrozenDefine<{
        id: string,
        name: string,
        icon: FileTypes.SimpleVisual | null,
        audio: FileTypes.SimpleAudio | null,
        labels: LibTypes.Arr<string>,
    }>;

    // TODO 有风险
    type InitialAbility = LibTypes.VarDefine<{
        readonly id: string,
        readonly name: string,
        colors: {
            start: LibTypes.Nullable<string>,
            transition: LibTypes.Nullable<string>,
            end: LibTypes.Nullable<string>,
        },
        lottie: FileTypes.SimpleVisual,
        percent: number,
    }>;

    type Ability = LibTypes.FrozenDefine<{
        id: string,
        emoji: string,
        name: string,
        desc: string,
        value: number,
    }>;

    type Figure = LibTypes.VarDefine<{
        id: string,
        name: string,
        isDefault: boolean,
        visual: FileTypes.ImageResource,
    }>;

    type FigureLibItem = LibTypes.VarDefine<{
        id: string,
        name: string,
        backgroundColor: string | null,
        figures: LibTypes.Arr<Figure>,
    }>;

    type FigureLib = LibTypes.VarGeneralObj<FigureLibItem>;

    type HourSlot = LibTypes.VarDefine<{
        hour: number,
        items: LibTypes.VarArr<FrozenScheduleInfo>,
    }>;

    type Behavior = LibTypes.VarDefine<{
        location: string | null,
        backgroundImage: FileTypes.ImageResource | null,
        backgroundColor: string | null,
        status: string | null,
        currentFigureVisual: FileTypes.ImageResource | null,

        lastMessage: FrozenMessageInfo | null,
        newMessageCount: number,
    }>;

    type MessageInput = LibTypes.FrozenDefine<
        ApiTypes.Protocol.PhoneMessageInput & {
            id: string,
        }
    >;
}
