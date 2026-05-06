import type { BaseEntity } from '../../core/@com';
import type { FileTypes } from '../file';

declare module 'type-fest' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface ReadonlyDeepIgnore {
        BaseEntity: LibTypes.VarDefine<{
            [BaseEntity.BaseEntitySymbol]: typeof BaseEntity.BaseEntitySymbol,
        }>,
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Error {
        readonly msg?: string,
    }
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
        interface ExpoProcessEnv {
            readonly EAS_BUILD_ID?: string,

            readonly EXPO_PUBLIC_STORYBOOK_ENABLED?: '1',

            readonly EXPO_PUBLIC_PRODUCTION?: '1',
            readonly EXPO_PUBLIC_PREVIEW?: '1',
            readonly EXPO_PUBLIC_DEVELOPMENT?: '1',
            readonly EXPO_PUBLIC_ONLINE?: '1',

            readonly EXPO_PUBLIC_API_ORIGIN?: string,
            readonly EXPO_PUBLIC_CDN_ORIGIN?: string,

            // readonly EXPO_PUBLIC_APPSFLYER_LIVE_EVENT?: string,

            readonly EAS_BUILD_IOS_BUILD_NUMBER?: string,
            readonly EAS_BUILD_ANDROID_VERSION_CODE?: string,

            // 以下为业务token
            readonly SENTRY_AUTH_TOKEN?: string,
        }
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface NodeRequire {
        // eslint-disable-next-line @typescript-eslint/prefer-function-type
        (id: string): FileTypes.RequireMediaAsset,
    }

    type HermesInternal = LibTypes.FrozenDefine<{
        enablePromiseRejectionTracker: (
            options: LibTypes.FrozenDefine<{
                allRejections?: boolean,
                whitelist?: LibTypes.Arr<ErrorConstructor>,
                onUnhandled?: (id: number, error: unknown) => void,
                onHandled?: (id: number, error: unknown) => void,
            }>,
        ) => void,
    }>;

    // eslint-disable-next-line no-inner-declarations
    var VideoFrame: LibTypes.Class | undefined;

    // web版：RN 全局变量 stubs
    const __DEV__: boolean;
    var HermesInternal: HermesInternal | undefined;
}
