// import AppsFlyer, { type UnifiedDeepLinkData } from 'react-native-appsflyer';

// import { BaseService, service } from '$/core';
// import { KeyUtils, TimerUtils } from '$/utils';

// import { DeviceService } from './device';
// import { PermissionService } from './permission';
// import { ReportService } from './report';

// type LinkDataPromise = LibTypes.Define<{
//     resolve: LibTypes.Nullable<
//         LibTypes.Func<unknown, [res: UnifiedDeepLinkData]>
//     >,
//     reject: LibTypes.Nullable<LibTypes.SimpleFunction>,
//     promise: LibTypes.Promisable<UnifiedDeepLinkData>,
// }>;

// const EventNameMap: LibTypes.GeneralObj<string, string> = {
//     evt: 'id',
// };
// const InitConfig = {
//     devKey: 'kYMoqsZFNLeZYcGaVMvus4',
//     appId: '6741684509',
// };

// const GetLinkDataTimeout = 5000;
// const OneLinkUrl = 'myapp.onelink.me';
// const RoutePageKey = 'p';

// @service()
// export class AppsFlyerService extends BaseService {
//     public constructor(
//         reportService: ReportService,
//         deviceService: DeviceService,
//         permissionService: PermissionService,
//     ) {
//         super();

//         this.#reportService = reportService;
//         this.#deviceService = deviceService;
//         this.#permissionService = permissionService;

//         this.#requestLiveEventPermissions();

//         this.#linkDataPromises = new Map();
//         AppsFlyer.onDeepLink(res => {
//             if (res.deepLinkStatus === 'FOUND') {
//                 const link = res.data.link;
//                 if (this.#linkDataPromises.has(link)) {
//                     const linkDataPromise = this.#linkDataPromises.get(link);
//                     linkDataPromise?.resolve?.(res);
//                 } else {
//                     this.#linkDataPromises.set(link, {
//                         resolve: null,
//                         reject: null,
//                         promise: res,
//                     });
//                 }
//             }
//         });

//         this.#initProsmise = AppsFlyer.initSdk({
//             isDebug: !(process.env.EXPO_PUBLIC_APPSFLYER_LIVE_EVENT == null),
//             devKey: InitConfig.devKey,
//             appId: InitConfig.appId,
//             onInstallConversionDataListener: false,
//             onDeepLinkListener: true,
//         });
//     }

//     // init session UUID at the first time,
//     // reportController will update it every time app is active
//     #sessionUUID = KeyUtils.uuid();

//     readonly #reportService;
//     readonly #deviceService;
//     readonly #permissionService;

//     readonly #initProsmise;
//     readonly #linkDataPromises: Map<string, LibTypes.Nullable<LinkDataPromise>>;

//     #initialized = false;

//     async #initIfNeeded() {
//         if (!this.#initialized) {
//             await this.#initProsmise;
//             this.#initialized = true;
//         }
//     }

//     async #requestLiveEventPermissions() {
//         if (process.env.EXPO_PUBLIC_APPSFLYER_LIVE_EVENT != null) {
//             await this.#permissionService.getTrackingPermissions();
//         }
//     }

//     async #getDeviceId() {
//         return new Promise<string>(resolve => {
//             AppsFlyer.getAppsFlyerUID((_, deviceId: string) => {
//                 resolve(deviceId);
//             });
//         });
//     }

//     async #getLinkData(url: string) {
//         await this.#initIfNeeded();

//         if (this.#linkDataPromises.has(url)) {
//             return this.#linkDataPromises.get(url)?.promise;
//         }

//         let resolveFunc = null;
//         let rejectFunc = null;

//         const linkDataPromise = new Promise<UnifiedDeepLinkData>(
//             (resolve, reject) => {
//                 resolveFunc = resolve;
//                 rejectFunc = reject;
//             },
//         );

//         this.#linkDataPromises.set(url, {
//             resolve: resolveFunc,
//             reject: rejectFunc,
//             promise: linkDataPromise,
//         });

//         return linkDataPromise;
//     }

//     public readonly logEvent = async (
//         name: string,
//         params?: LibTypes.GeneralObj,
//     ) => {
//         await this.#initIfNeeded();

//         const commonData = await this.#reportService.getCommonInfo();

//         const deviceId = await this.#getDeviceId();
//         const { type } = await this.#deviceService.getNetworkState();

//         const appsflyerCommonInfo = {
//             event_time: commonData.timestamp,
//             user_id: commonData.userId ?? deviceId,
//             device_id: deviceId,
//             network: type,
//             app_version: commonData.appVersion,
//             os_version: commonData.osVersion,
//             session_id: this.#sessionUUID,
//         };

//         AppsFlyer.logEvent(name, { ...appsflyerCommonInfo, ...params });
//     };

//     public readonly getLinkData = async (url: string, timeoutMS?: number) =>
//         Promise.race([
//             this.#getLinkData(url),
//             TimerUtils.sleep(timeoutMS ?? GetLinkDataTimeout),
//         ]);

//     public readonly isFromAppsFlyer = (url: string) =>
//         new URL(url).hostname === OneLinkUrl;

//     public readonly getRouteName = (url: string) =>
//         new URL(url).searchParams.get(RoutePageKey);

//     public readonly getRouteParam = (url: string, key: string) => {
//         const searchParams = new URL(url).searchParams;
//         const translatedKey = EventNameMap[key] ?? key;
//         return searchParams.get(translatedKey);
//     };

//     public readonly updateSessionUUID = () => {
//         this.#sessionUUID = KeyUtils.uuid();
//     };
// }
