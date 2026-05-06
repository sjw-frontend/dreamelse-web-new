// @ts-nocheck
import type { UserTypes } from './user';

export declare namespace AppTypes {
    type StoreData = LibTypes.VarDefine<{
        loggedIn: LoggedInInfo | null,
        uuid: string | null,
    }>;

    type LoggedInInfo = LibTypes.FrozenDefine<{
        userInfo: LibTypes.FrozenOmit<
            UserTypes.UserInfo,
            'characterDetails' | 'scriptDetails'
        >,
        token: string,
    }>;

    type RemoteConfig = LibTypes.FrozenDefine<{
        allowRecordScreen?: boolean,
        waitCharacterSoulLoadingTextList?: LibTypes.Arr<string>,
        waitCharacterOpeningLoadingTextList?: LibTypes.Arr<string>,
        waitNarrativeLoadingTextList?: LibTypes.Arr<string>,
    }>;

    type ExpoConfig = typeof import('../../app.config').default;
}
