import type { DataStoreTypes } from '$/types';

import type { CharacterTypes } from './character';

export declare namespace UserTypes {
    type UserId = string;

    type UserState = LibTypes.VarDefine<{
        readonly email: string,
        readonly phoneNumber: string,
        // readonly loginType: UserEnums.LoginType,

        nickname: string,
        avatar: string,
    }>;

    type UserAttrs = LibTypes.VarDefine<{
        readonly uniqueId: string,
        readonly characterDetails: CharacterDetails,
        readonly scriptDetails: ScriptDetails,
    }>;

    type UserInfo = DataStoreTypes.DataItem<UserState, UserAttrs>;

    type FrozenUserInfo = LibTypes.FrozenDefine<UserInfo>;
}

export declare namespace UserTypes {
    type CharacterDetailsState = LibTypes.VarDefine<{
        list: LibTypes.Arr<CharacterTypes.CharacterId>,
    }>;

    type CharacterDetailsAttrs = LibTypes.VarDefine<{
        listHasMore: boolean,
        listCursor: string | null,
    }>;

    type CharacterDetails = DataStoreTypes.ReactiveData<
        CharacterDetailsState,
        CharacterDetailsAttrs
    >;
}

export declare namespace UserTypes {
    type ScriptDetailsState = LibTypes.VarDefine<
        ScriptStats & {
            local: ScriptStats,
            remote: ScriptStats,
        }
    >;

    type ScriptDetailsAttrs = LibTypes.Reference;

    type ScriptDetails = DataStoreTypes.ReactiveData<ScriptDetailsState>;
}

export declare namespace UserTypes {
    type JSONInitialUserInfo = LibTypes.SetFieldType<
        UserInfo,
        'characterDetails' | 'scriptDetails',
        null
    >;

    type PartialInitialUserInfo = LibTypes.SetRequired<
        Partial<UserInfo>,
        'id' | 'state' | 'uniqueId'
    >;

    type ScriptStats = LibTypes.VarDefine<{
        playCount: number,
        createCount: number,
        collectCount: number,
        memoryCount: number,
        draftCount: number,
    }>;
}
