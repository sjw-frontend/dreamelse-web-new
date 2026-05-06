// @ts-nocheck
// web版：替换 AsyncStorage → localStorage
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
    [Keys.LoggedInUser]: UserTypes.JSONInitialUserInfo;
    [Keys.AppMuted]: LibTypes.FrozenDefine<{ muted: boolean }>;
    [Keys.Guide]: LibTypes.FrozenDefine<{ finished: boolean; skiped: boolean }>;
}>;

@service()
export class StoreService extends BaseStoreService<JsonValues, Keys> {
    public constructor() {
        super({
            setItem: async (key: string, value: string) => { localStorage.setItem(key, value); },
            getItem: async (key: string) => localStorage.getItem(key),
            removeItem: async (key: string) => { localStorage.removeItem(key); },
            versions: {
                [Keys.LoggedInUser]: '2.0',
            },
        });
    }

    public override readonly Keys = Keys;
}
