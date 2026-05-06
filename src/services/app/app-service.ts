// @ts-nocheck
import { AppState } from 'react-native';

import { APP, DEVICE } from '$/consts';
import { BaseService, service } from '$/core';
import type { AppTypes, UserTypes } from '$/types';
import { KeyUtils } from '$/utils';

import { SecureStoreService } from '../secure-store';
import { StoreService } from '../store';

import { Settings } from './app-const';

type EventMap = LibTypes.FrozenDefine<{
    storeDataChange: <
        K extends Exclude<LibTypes.WritableKeysOf<AppTypes.StoreData>, 'uuid'>,
    >(
        key: K,
        value: AppTypes.StoreData[K],
    ) => void,
}>;

@service()
export class AppService extends BaseService<EventMap> {
    public constructor(
        storeService: StoreService,
        secureStoreService: SecureStoreService,
    ) {
        super();
        this.#storeService = storeService;
        this.#secureStoreService = secureStoreService;

        this.#initPromise = this.#init();
    }

    readonly #storeService;
    readonly #secureStoreService;

    readonly #initPromise;

    readonly #storeDataCache: AppTypes.StoreData = {
        loggedIn: null,
        uuid: null,
    };

    public readonly AppState = AppState;

    public get AppInfo() {
        return {
            appVersion: APP.Version,
            buildCode: APP.BuildCode,
            buildId: APP.BuildId,
            device: DEVICE.Kind,
            deviceModel: DEVICE.ModelName,
            platform: DEVICE.Platform.Kind,
            platformId: DEVICE.Platform.Id,
            os: DEVICE.OS.Kind,
            osVersion: DEVICE.OS.Version,
        };
    }

    async #init() {
        const [userInfo, tokenInfo, uuid] = await Promise.all([
            this.#storeService.getJSON(this.#storeService.Keys.LoggedInUser),
            this.#secureStoreService.getJSON(
                this.#secureStoreService.Keys.LoggedInUserToken,
            ),
            this.#storeService.get(this.#storeService.Keys.UUID),
        ]);

        this.#storeDataCache.uuid = uuid;
        if (userInfo != null && userInfo.id === tokenInfo?.id) {
            this.#storeDataCache.loggedIn = {
                userInfo,
                token: tokenInfo.token,
            };
        }
    }

    async #setStoreData<K extends LibTypes.WritableKeysOf<AppTypes.StoreData>>(
        key: K,
        value: AppTypes.StoreData[K],
    ) {
        this.#storeDataCache[key] = value;

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
        const data = {
            key,
            value,
        } as LibTypes.KeyValueUnion<AppTypes.StoreData>;

        if (data.key === 'uuid') {
            if (data.value != null) {
                await this.#storeService.set(
                    this.#storeService.Keys.UUID,
                    data.value,
                );
            } else {
                await this.#storeService.remove(this.#storeService.Keys.UUID);
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (data.key === 'loggedIn') {
            if (data.value != null) {
                const userInfo: UserTypes.JSONInitialUserInfo = {
                    ...data.value.userInfo,
                    characterDetails: null,
                    scriptDetails: null,
                };
                await Promise.all([
                    this.#storeService.setJSON(
                        this.#storeService.Keys.LoggedInUser,
                        userInfo,
                        Settings.loggedInUserCacheMaxAge,
                    ),
                    this.#secureStoreService.setJSON(
                        this.#secureStoreService.Keys.LoggedInUserToken,
                        {
                            id: userInfo.id,
                            token: data.value.token,
                        },
                        Settings.loggedInUserCacheMaxAge,
                    ),
                ]);
            } else {
                await Promise.all([
                    this.#storeService.remove(
                        this.#storeService.Keys.LoggedInUser,
                    ),
                    this.#secureStoreService.remove(
                        this.#secureStoreService.Keys.LoggedInUserToken,
                    ),
                ]);
            }
        }
    }

    public readonly setStoreData = async <
        K extends Exclude<LibTypes.WritableKeysOf<AppTypes.StoreData>, 'uuid'>,
    >(
        key: K,
        value: AppTypes.StoreData[K],
    ) => {
        await this.#setStoreData(key, value);
        this.emitEvent('storeDataChange', key, value);
    };

    public readonly getStoreData = async () => {
        await this.#initPromise;

        const data = this.#storeDataCache;

        const result = {
            ...data,
            uuid: data.uuid ?? KeyUtils.uuid(),
        };

        if (data.uuid == null) {
            await this.#setStoreData('uuid', result.uuid);
        }

        return result as LibTypes.ReadonlyDeep<typeof result>;
    };
}
