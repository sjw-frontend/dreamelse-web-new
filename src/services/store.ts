// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';

import { service } from '$/core';
import type { UserTypes } from '$/types';

import { BaseStoreService } from './@base/base-store';

enum Keys {
    LoggedInUser = 'loggedInUser',
    UUID = 'uuid',
    AppMuted = 'appMuted',
    Guide = 'guide',
}

type JsonValues = LibTypes.FrozenDefine<{
    [Keys.LoggedInUser]: UserTypes.JSONInitialUserInfo,
    [Keys.AppMuted]: LibTypes.FrozenDefine<{
        muted: boolean,
    }>,
    [Keys.Guide]: LibTypes.FrozenDefine<{
        finished: boolean,
        skiped: boolean,
    }>,
}>;

@service()
export class StoreService extends BaseStoreService<JsonValues, Keys> {
    public constructor() {
        super({
            setItem: AsyncStorage.setItem,
            getItem: AsyncStorage.getItem,
            removeItem: AsyncStorage.removeItem,
            versions: {
                [Keys.LoggedInUser]: '2.0',
            },
        });
    }

    public override readonly Keys = Keys;
}
