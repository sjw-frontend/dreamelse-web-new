// @ts-nocheck
import { BaseZoneController, zoneController } from '$/core';
import { DataStoreDomain } from '$/domains';
import { ApiService, AppService } from '$/services';
import type { ApiTypes, CharacterTypes, UserTypes } from '$/types';
import { DataStoreUtils, ObjectUtils } from '$/utils';

import { RouterController } from '../router/router-controller';

type InternalState = LibTypes.VarDefine<{
    loggedInUser: LibTypes.Nullable<UserTypes.FrozenUserInfo>,
}>;

type State = LibTypes.FrozenPick<InternalState, 'loggedInUser'>;

@zoneController()
export class UserController extends BaseZoneController<State, InternalState> {
    public constructor(
        appService: AppService,
        apiService: ApiService,
        // fileService: FileService,

        routerController: RouterController,
    ) {
        super();
        this.#appService = appService;
        // this.#fileService = fileService;
        this.#routerController = routerController;
        this.#apiService = apiService;

        this.#init();
    }

    readonly #appService;
    readonly #routerController;
    readonly #apiService;

    readonly #userDataStore = this.getDomain(
        DataStoreDomain<UserTypes.UserState, UserTypes.UserAttrs>,
    );

    #init() {
        this.watch(
            () => this.internal.loggedInUser,
            async loggedInUser => {
                if (loggedInUser) {
                    const storeData = await this.#appService.getStoreData();
                    storeData.loggedIn?.token != null &&
                        this.#appService.setStoreData('loggedIn', {
                            userInfo: loggedInUser,
                            token: storeData.loggedIn.token,
                        });
                }
            },
            {
                deep: true,
            },
        );
    }

    #createUserInfo(initialInfo: UserTypes.PartialInitialUserInfo) {
        const userInfo: UserTypes.UserInfo = {
            ...initialInfo,
            isLocal: false,
            state: initialInfo.state,
            characterDetails: DataStoreUtils.proxyReactiveData({
                state: {
                    list: [],
                },
                listHasMore: true,
                listCursor: null,
            }),
            scriptDetails: {
                state: {
                    get playCount() {
                        return this.local.playCount + this.remote.playCount;
                    },
                    get createCount() {
                        return this.local.createCount + this.remote.createCount;
                    },
                    get collectCount() {
                        return (
                            this.local.collectCount + this.remote.collectCount
                        );
                    },
                    get memoryCount() {
                        return this.local.memoryCount + this.remote.memoryCount;
                    },
                    get draftCount() {
                        return this.local.draftCount + this.remote.draftCount;
                    },
                    remote: {
                        playCount: 0,
                        createCount: 0,
                        collectCount: 0,
                        memoryCount: 0,
                        draftCount: 0,
                    },
                    local: {
                        playCount: 0,
                        createCount: 0,
                        collectCount: 0,
                        memoryCount: 0,
                        draftCount: 0,
                    },
                },
            },
        };

        return userInfo;
    }

    #login(initialInfo: UserTypes.PartialInitialUserInfo) {
        return this.#userDataStore.upsert(this.#createUserInfo(initialInfo));
    }

    protected override getInitialInternalState(): InternalState {
        return {
            loggedInUser: null,
        };
    }

    public readonly createInitialUserInfoFromApiRes = (
        userInfo: ApiTypes.Protocol.UserInfo,
    ): UserTypes.PartialInitialUserInfo => ({
        id: userInfo.uid,
        uniqueId: userInfo.display_uid,
        state: {
            email: '',
            // loginType: UserEnums.LoginType.Unknown,
            phoneNumber: userInfo.phone ?? '',
            nickname: userInfo.user_name,
            avatar: '',
        },
    });

    public readonly setMyState = <
        K extends LibTypes.WritableKeysOf<UserTypes.UserState>,
    >(
        keyPath: K,
        updaterValue: LibTypes.UpdaterValue<
            LibTypes.Get<UserTypes.UserState, K>
        >,
    ) => {
        if (this.internal.loggedInUser) {
            this.#userDataStore.setState(
                this.internal.loggedInUser.id,
                keyPath,
                updaterValue,
            );
        }
    };

    public readonly setMyScriptStats = (
        stats: LibTypes.UpdaterNewValue<
            UserTypes.ScriptStats,
            Partial<UserTypes.ScriptStats>
        >,
    ) => {
        if (this.internal.loggedInUser) {
            const value = ObjectUtils.handleUpdaterNewValue(
                stats,
                this.internal.loggedInUser.scriptDetails.state.local,
            );

            ObjectUtils.removeUndefinedKeys(value);

            this.#userDataStore.setAttr(
                this.internal.loggedInUser.id,
                'scriptDetails.state.local',
                prevValue => ({
                    ...prevValue,
                    ...value,
                }),
            );
        }
    };

    public readonly setMyCharacterList = (
        list: LibTypes.Arr<CharacterTypes.CharacterId>,
    ) => {
        if (this.internal.loggedInUser) {
            this.#userDataStore.setAttr(
                this.internal.loggedInUser.id,
                'characterDetails.state.list',
                list,
            );
        }
    };

    public readonly login = (
        userInfo: UserTypes.PartialInitialUserInfo,
        token: string,
    ) => {
        this.internal.loggedInUser = this.#login(userInfo);

        this.#appService.setStoreData('loggedIn', {
            userInfo: this.internal.loggedInUser,
            token,
        });
    };

    public readonly loginByCache = async () => {
        const appStoreData = await this.#appService.getStoreData();

        if (appStoreData.loggedIn?.userInfo) {
            this.internal.loggedInUser = this.#login(
                appStoreData.loggedIn.userInfo,
            );
        }
    };

    public readonly logout = () => {
        this.#routerController.resetToHome();

        this.#appService.setStoreData('loggedIn', null);

        this.internal.loggedInUser = null;
    };

    public readonly isLoggedIn = (autoGoLogin = true) => {
        const loggedInUser = this.state.loggedInUser;
        if (!loggedInUser) {
            autoGoLogin && this.#routerController.toLogin();
            return null;
        }

        return loggedInUser;
    };

    public readonly getUniqueId = async () =>
        this.internal.loggedInUser?.id ??
        (await this.#appService.getStoreData()).uuid;

    public readonly requestScriptStats = async () => {
        if (this.internal.loggedInUser) {
            const res = await this.#apiService.call.user.get_home_page_stat();
            this.#userDataStore.setAttr(
                this.internal.loggedInUser.id,
                'scriptDetails.state.local',
                {
                    playCount: 0,
                    createCount: 0,
                    collectCount: 0,
                    memoryCount: 0,
                    draftCount: 0,
                },
            );
            this.#userDataStore.setAttr(
                this.internal.loggedInUser.id,
                'scriptDetails.state.remote',
                {
                    playCount: res.played_script_count,
                    createCount: res.created_script_count,
                    collectCount: res.favourite_script_count,
                    memoryCount: res.memory_count,
                    draftCount: res.draft_script_count,
                },
            );
        }
    };
}
