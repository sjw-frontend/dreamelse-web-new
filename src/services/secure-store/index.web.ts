// @ts-nocheck
// web版：升级为 IndexedDB (idb-keyval)
import 'reflect-metadata';
import { get, set, del } from 'idb-keyval';
import { service } from '$/core';
import type { UserTypes } from '$/types';
import { BaseStoreService } from '../@base/base-store';

enum Keys {
    LoggedInUserToken = 'loggedInUserToken',
}

type JsonValues = LibTypes.FrozenDefine<{
    [Keys.LoggedInUserToken]: {
        id: UserTypes.UserId;
        token: string;
    };
}>;

@service()
export class SecureStoreService extends BaseStoreService<JsonValues, Keys> {
    public constructor() {
        super({
            setItem: async (key: string, value: string) => { await set(key, value); },
            getItem: async (key: string) => (await get<string>(key)) ?? null,
            removeItem: async (key: string) => { await del(key); },
            versions: {},
        });
    }

    public override readonly Keys = Keys;
}
