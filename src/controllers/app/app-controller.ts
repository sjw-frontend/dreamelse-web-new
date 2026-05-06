// @ts-nocheck
import { APP, type I18N, LINKING } from '$/consts';
import { BaseZoneController, zoneController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiError } from '$/errors';
import {
    ApiService,
    AppService,
    // AppsFlyerService,
    DeviceService,
    FetchService,
    LinkingService,
    StoreService,
} from '$/services';
import type { AppTypes, RouterTypes } from '$/types';
import { StringUtils, TaskUtils } from '$/utils';

import { DeviceController } from '../device/device-controller';
import { RouterController } from '../router/router-controller';

import { Settings } from './app-const';

type InternalState = LibTypes.VarDefine<{
    firstRoute: RouterTypes.SimpleRouteWithController | null,
    remoteConfig: AppTypes.RemoteConfig,

    active: boolean,
    firstRouteReady: boolean,
    controlMuted: boolean,
    enabled: boolean,
    coldBoot: boolean,
    lock: boolean,
    visibleWhenInactive: boolean,
    get muted(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'active'
    | 'coldBoot'
    | 'controlMuted'
    | 'enabled'
    | 'firstRoute'
    | 'firstRouteReady'
    | 'lock'
    | 'muted'
    | 'remoteConfig'
    | 'visibleWhenInactive'
>;

type LockOptions = LibTypes.FrozenDefine<{
    timeoutMS?: number,
}>;

type EventMap = LibTypes.FrozenDefine<{
    confirmNoNetwork: LibTypes.Asyncable<boolean>,
    longTask: LibTypes.Func<
        void,
        [task: LibTypes.Promisable, options: LockOptions]
    >,
    waitMoment: LibTypes.Func<
        void,
        [task: LibTypes.Promisable, options: LockOptions]
    >,
    toast: LibTypes.Func<void, [i18nKey: keyof typeof I18N.Texts]>,
    errorDialog: LibTypes.Func<void, [msg: string]>,
}>;

@zoneController()
export class AppController extends BaseZoneController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        appService: AppService,
        deviceService: DeviceService,
        // appsflyerService: AppsFlyerService,
        linkingService: LinkingService,
        storeService: StoreService,
        fetchService: FetchService,
        routerController: RouterController,
        deviceController: DeviceController,
        apiService: ApiService,
    ) {
        super();
        this.#appService = appService;
        this.#deviceService = deviceService;
        // this.#appsflyerService = appsflyerService;
        this.#storeService = storeService;
        this.#fetchService = fetchService;
        this.#linkingService = linkingService;
        this.#routerController = routerController;
        this.#deviceController = deviceController;
        this.#apiService = apiService;

        this.#handleRejection();
        this.#init();
    }

    readonly #appService;
    readonly #deviceService;
    // readonly #appsflyerService;
    readonly #storeService;
    readonly #linkingService;
    readonly #fetchService;
    readonly #routerController;
    readonly #deviceController;
    readonly #apiService;

    readonly #AllowLinkingRouteNames = [RouterEnums.RouteName.Home] as const;

    #init() {
        let continueFetch: LibTypes.SimpleFunction | null = null;
        let networkTimerHandle: LibTypes.TimerHandle;

        this.watch(
            () => this.#deviceController.state.internetReachable,
            internetReachable => {
                if (internetReachable) {
                    clearTimeout(networkTimerHandle);
                    continueFetch?.();
                } else {
                    continueFetch = this.#fetchService.suspend();
                    networkTimerHandle = setTimeout(async () => {
                        if (await this.emitEvent('confirmNoNetwork').race) {
                            this.#deviceService.openSettings();
                        }
                    }, Settings.networkDisabledTimeout);
                }
            },
            {
                sync: true,
                immediate: true,
            },
        );

        this.#linkingService.addLinkingListener('url', ({ url }) => {
            const route = this.#parseLinkingUrl(url);
            if (route) {
                this.#routerController.resetTo(route.name, route.params);
            }
        });

        this.#appService.AppState.addEventListener('change', state => {
            this.internal.active = state === 'active';
            this.internal.coldBoot = false;
        });
        // TODO 优化：去掉这条，都放到addEventListener里
        this.internal.active =
            this.#appService.AppState.currentState === 'active';

        // try {
        //     const [checkAppVersionRes, sysConfigRes] = await Promise.all([
        //         this.#apiService.call.system.checkAppVersion({
        //             ...this.#appService.AppInfo,
        //         }),
        //         this.#apiService.call.system.getSystemConfig({
        //             ...this.#appService.AppInfo,
        //         }),
        //     ]);

        //     this.internal.remoteConfig = sysConfigRes;

        //     // TODO
        //     if (checkAppVersionRes.needForceUpdate) {
        //         this.#popupController.openDialog({
        //             title: this.#i18n.updateApp(),
        //             content: StringUtils.getDefaultIfEmpty(
        //                 checkAppVersionRes.text,
        //                 this.#i18n.updateAppContent(),
        //             ),
        //             buttons: [
        //                 {
        //                     text: this.#i18n.updateNow(),
        //                     onPress: () => {
        //                         !StringUtils.isEmpty(checkAppVersionRes.link) &&
        //                             this.#linkingService.open(
        //                                 checkAppVersionRes.link,
        //                             );
        //                     },
        //                 },
        //             ],
        //         });
        //         return;
        //     }

        //     if (checkAppVersionRes.checkType !== AppEnums.VersionCheck.OK) {
        //         this.#popupController
        //             .openDialogConfirm({
        //                 title: this.#i18n.updateApp(),
        //                 content: StringUtils.getDefaultIfEmpty(
        //                     checkAppVersionRes.text,
        //                     this.#i18n.updateAppContent(),
        //                 ),
        //                 okButton: this.#i18n.updateNow(),
        //                 cancelButton: this.#i18n.later(),
        //             })
        //             .then(result => {
        //                 if (result) {
        //                     !StringUtils.isEmpty(checkAppVersionRes.link) &&
        //                         this.#linkingService.open(
        //                             checkAppVersionRes.link,
        //                         );
        //                 }
        //             });
        //     }
        // } catch {
        //     this.#popupController.openDialog({
        //         title: this.#i18n.networkBusy(),
        //         content: this.#i18n.networkBusyContent(),
        //     });
        //     return;
        // }

        this.internal.enabled = true;

        this.#deviceService.addVolumeListener(() => {
            if (this.internal.active) {
                this.internal.controlMuted = false;
            }
        });

        this.#storeService
            .getJSON(this.#storeService.Keys.AppMuted)
            .then(store => {
                if (store) {
                    this.internal.controlMuted = store.muted;
                }
            });

        this.watch(
            () => this.internal.controlMuted,
            muted => {
                this.#storeService.setJSON(this.#storeService.Keys.AppMuted, {
                    muted,
                });
            },
            {
                immediate: true,
            },
        );

        this.#apiService.call.app.config(null, { retry: 2 }).then(res => {
            this.internal.remoteConfig = {
                ...this.internal.remoteConfig,
                allowRecordScreen: res.allow_record_screen,
            };
            this.internal.visibleWhenInactive =
                !!this.internal.remoteConfig.allowRecordScreen;
        });

        this.#apiService.call.app
            .get_loading_tips(null, { retry: 2 })
            .then(res => {
                console.log('get_loading_tips', res);
                this.internal.remoteConfig = {
                    ...this.internal.remoteConfig,
                    waitCharacterOpeningLoadingTextList: res.prologue_loading,
                    waitCharacterSoulLoadingTextList: res.character_loading,
                    waitNarrativeLoadingTextList: res.play_loading,
                };
            });
    }

    #handleRejection() {
        // 这个是用来做什么的,看起来像是错误日志上报?
        if (typeof HermesInternal === 'undefined') return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (HermesInternal as HermesInternal).enablePromiseRejectionTracker({
            allRejections: true,
            onUnhandled: (_id, error) => {
                if (error instanceof ApiError) {
                    if (!StringUtils.isEmpty(error.jsonBody.msg)) {
                        this.emitEvent('errorDialog', error.jsonBody.msg);
                    } else if (!StringUtils.isEmpty(error.customMsg)) {
                        this.emitEvent('errorDialog', error.customMsg);
                    }
                }
                console.error(
                    '[Unhandled Rejection]',
                    error,
                    typeof error === 'object' && { ...error },
                );
            },
        });
    }

    #isAllowLinkingRouteName(
        pathname: string,
    ): pathname is RouterEnums.RouteName {
        const list: LibTypes.Arr<string> = this.#AllowLinkingRouteNames.map(
            item => item.trim().toLowerCase(),
        );
        return list.includes(pathname.trim().toLowerCase());
    }

    #parseLinkingUrl(url: string) {
        const urlObj = new URL(url);
        // const isFromAppsFlyer = this.#appsflyerService.isFromAppsFlyer(url);

        let routeName;
        if (urlObj.protocol === LINKING.Protocols.UniversalLink) {
            // if (isFromAppsFlyer) {
            //     // handle AppsFlyer universal links
            //     routeName = this.#appsflyerService.getRouteName(url);
            // } else {
            // handle self-owned universal links
            routeName = urlObj.href
                .trim()
                .toLowerCase()
                .replace(
                    new RegExp(
                        `^${LINKING.UniversalLinkPrefix.trim().toLowerCase()}`,
                    ),
                    '',
                )
                .split('?')[0]
                ?.split('/')
                .find(pathname => pathname.length > 0);
            // }
        } else if (urlObj.protocol === LINKING.Protocols.DeepLink) {
            routeName = urlObj.host;
        }

        if (routeName != null && this.#isAllowLinkingRouteName(routeName)) {
            const params: LibTypes.Writable<RouterTypes.RouteParams & {}> = {};
            const keyList = ['evt'] satisfies LibTypes.ValueOf<
                typeof LINKING.RouteSchemes
            >['searchKeys'];

            keyList.forEach(key => {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (key === 'evt') {
                    // const value = isFromAppsFlyer
                    //     ? this.#appsflyerService.getRouteParam(url, key)
                    //     : urlObj.searchParams.get(key);
                    const value = urlObj.searchParams.get(key);
                    if (!StringUtils.isEmpty(value)) {
                        const id = parseInt(atob(value));
                        if (!isNaN(id)) {
                            params.ids = [id];
                        }
                    }
                }
            });

            const route: RouterTypes.SimpleRoute = {
                name: routeName,
                params,
            };

            return route;
        }

        return null;
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            remoteConfig: {},

            coldBoot: true,
            enabled: false,
            active: true,
            firstRoute: null,
            firstRouteReady: false,
            controlMuted: false,
            lock: false,
            visibleWhenInactive: true,
            get muted() {
                return $this.#deviceController.state.muted || this.controlMuted;
            },
        };
    }

    public readonly toggleMuted = () => {
        this.internal.controlMuted = !this.internal.controlMuted;
    };

    public readonly preloadFirstRoute = async () => {
        const url = await this.#linkingService.getInitialUrl();
        const result = !StringUtils.isEmpty(url) && this.#parseLinkingUrl(url);

        let route: RouterTypes.SimpleRouteWithController;
        let ctrl;

        const params: RouterTypes.RouteParams = {
            options: {
                animation: APP.FirstRoute.animation,
                animationTypeForReplace: APP.FirstRoute.animationTypeForReplace,
                animationDuration: APP.FirstRoute.animationDuration,
            },
        };

        if (result !== false && result) {
            ctrl = await this.#routerController.preload(result.name, {
                ...params,
                ...result.params,
            });
            this.#routerController.resetTo(result.name, {
                ...params,
                ...result.params,
            });
            route = {
                ...result,
                ctrl,
            };
        } else {
            ctrl = await this.#routerController.preload(
                RouterEnums.RouteName.Home,
                params,
            );
            route = {
                name: RouterEnums.RouteName.Home,
                ctrl,
            };
        }

        this.internal.firstRoute = route;

        this.watch(
            () => this.internal.firstRoute?.ctrl?.state.routeFocused === true,
            (value, _, unwatch) => {
                if (value) {
                    this.internal.firstRouteReady = true;
                    unwatch();
                }
            },
        );
    };

    public readonly longTask = async (
        task: LibTypes.Asyncable | LibTypes.Promisable,
        timeoutMS?: number,
    ) => {
        const p = TaskUtils.runAsyncableOrPromisable(task);
        this.emitEvent('longTask', p, { timeoutMS });
        await p;
    };

    public readonly waitMoment = async (
        task: LibTypes.Asyncable | LibTypes.Promisable,
        timeoutMS?: number,
    ) => {
        const p = TaskUtils.runAsyncableOrPromisable(task);
        this.emitEvent('waitMoment', p, { timeoutMS });
        await p;
    };

    public readonly toast = (i18nKey: keyof typeof I18N.Texts) =>
        this.emitEvent('toast', i18nKey);
}
