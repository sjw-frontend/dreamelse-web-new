import type { ScriptEnums } from '$/enums';
import type {
    ApiTypes,
    CharacterTypes,
    DataStoreTypes,
    FileTypes,
    UserTypes,
} from '$/types';

export declare namespace ScriptTypes {
    type BaseScriptState = LibTypes.VarDefine<{
        title: string, // 标题
        storyDesc: string, // 故事内容
        openingDesc: string, // 开场剧情设计

        roles: LibTypes.Arr<RoleInfo> | null,
        branches: LibTypes.Arr<string> | null,
        kinds: LibTypes.Arr<Kind> | null,
    }>;

    type BaseScriptAttrs = LibTypes.VarDefine<{
        version: LibTypes.Nullable<string>,
    }>;

    type ScriptId = DataStoreTypes.DataItemId;

    type ScriptStateGetter = LibTypes.Define<{
        get isOwner(): boolean,
    }>;

    type InitialScriptState = LibTypes.VarDefine<
        BaseScriptState & {
            isCollected: boolean,

            label: string,
            labelKind:
                | ApiTypes.Protocol.ScriptEntity['corner_tag_style']
                | null,

            tags: LibTypes.Arr<Tag>,

            author: LibTypes.Nullable<Author>,

            publishTime: LibTypes.Nullable<number>,
            updateTime: LibTypes.Nullable<number>,
            favouriteTime: LibTypes.Nullable<number>,
            lastPlayTime: LibTypes.Nullable<number>,

            preparePlayBackgroundImage: FileTypes.ImageResource | null,

            sceneInfoRecord: LibTypes.GeneralObj<SceneInfo | null>,
        }
    >;

    type ScriptState = LibTypes.VarDefine<
        InitialScriptState & ScriptStateGetter
    >;

    type ScriptAttrsGetterInfo = LibTypes.Exist;

    type InitialScriptAttrs = LibTypes.VarDefine<
        BaseScriptAttrs & {
            dramatizeInfo: {
                openingId: LibTypes.Nullable<string>,
                activePlayid: LibTypes.Nullable<string>,
                activeRoleId: LibTypes.Nullable<string>,
            },
            impressionId: LibTypes.Nullable<string>,
            draftInfo: FrozenDraftInfo | null,
        }
    >;

    type ScriptAttrs = LibTypes.VarDefine<
        InitialScriptAttrs & ScriptAttrsGetterInfo
    >;

    type ScriptInfo = DataStoreTypes.DataItem<ScriptState, ScriptAttrs>;

    type FrozenScriptInfo = LibTypes.FrozenDefine<ScriptInfo>;
}

export declare namespace ScriptTypes {
    type DraftId = DataStoreTypes.DataItemId;

    type DraftState = LibTypes.VarDefine<
        BaseScriptState & {
            fullyCustomRole: LibTypes.Nullable<boolean>,
            status: LibTypes.Nullable<ScriptEnums.Status>,
        }
    >;

    type DraftAttrs = LibTypes.VarDefine<
        BaseScriptAttrs & {
            scriptInfo: FrozenScriptInfo,
        }
    >;

    type DraftInfo = DataStoreTypes.DataItem<DraftState, DraftAttrs>;

    type FrozenDraftInfo = LibTypes.FrozenDefine<DraftInfo>;
}

export declare namespace ScriptTypes {
    type RoleId = DataStoreTypes.DataItemId;

    type RoleStateGetter = LibTypes.Define<{
        get characterInfo(): CharacterTypes.FrozenCharacterInfo | null,
    }>;

    type InitialRoleState = LibTypes.VarDefine<{
        backgroundDesc: string,
        supplementBackgroundDesc: LibTypes.Nullable<string>,
        secret: string,
        identities: LibTypes.Arr<Identity>,
        roleGoal: string,
        characterId: string | null,
    }>;

    type RoleState = LibTypes.VarDefine<InitialRoleState & RoleStateGetter>;

    type RoleAttrs = LibTypes.VarDefine<{
        readonly isOpen: boolean,
        readonly isNpc: boolean,
    }>;

    type RoleInfo = DataStoreTypes.DataItem<RoleState, RoleAttrs>;

    type FrozenRoleInfo = LibTypes.FrozenDefine<RoleInfo>;
}

export declare namespace ScriptTypes {
    type ApiScriptInfo = LibTypes.SetRequired<
        Partial<
            LibTypes.Simplify<
                ApiTypes.Protocol.ScriptDetailResp &
                    ApiTypes.Protocol.ScriptEntity &
                    ApiTypes.Protocol.ScriptInputEntity
            >
        >,
        'script_id'
    >;

    type DefaultConfig = LibTypes.FrozenDefine<{
        kindList: LibTypes.Arr<Tag>,
        feedTagList: LibTypes.Arr<FeedTag>,
        feedSearchHint: string,
    }>;

    type Tag = LibTypes.FrozenDefine<{
        id: string,
        label: string,
    }>;

    type Kind = LibTypes.FrozenDefine<{
        id: string,
        label: string,
    }>;

    type FeedTag = LibTypes.FrozenDefine<{
        index: number,
        name: string,
    }>;

    // TODO
    type Author = LibTypes.FrozenDefine<{
        id: UserTypes.UserId,
        name: string,
        isPlatform: boolean,
    }>;

    type Identity = LibTypes.VarDefine<{
        id: string,
        label: string,
        isRemote: LibTypes.Nullable<boolean>,
    }>;

    type SceneInfo = LibTypes.Define<{
        backgroundImage: LibTypes.Nullable<FileTypes.ImageResource>,
        bgColor: string | null,
        cover: FileTypes.ImageResource | null,
        coverRoles: LibTypes.Arr<FileTypes.ImageResource>,
    }>;
}
