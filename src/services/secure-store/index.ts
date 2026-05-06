// @ts-nocheck
import * as SecureStore from 'expo-secure-store';

import { service } from '$/core';
import type { UserTypes } from '$/types';

import { BaseStoreService } from '../@base/base-store';

enum Keys {
    LoggedInUserToken = 'loggedInUserToken',
}

type JsonValues = LibTypes.FrozenDefine<{
    [Keys.LoggedInUserToken]: {
        id: UserTypes.UserId,
        token: string,
    },
}>;

@service()
export class SecureStoreService extends BaseStoreService<JsonValues, Keys> {
    public constructor() {
        super({
            setItem: SecureStore.setItemAsync,
            getItem: SecureStore.getItemAsync,
            removeItem: SecureStore.deleteItemAsync,
            versions: {},
        });
    }

    public override readonly Keys = Keys;
}
