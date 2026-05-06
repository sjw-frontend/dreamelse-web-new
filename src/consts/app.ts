// web版：替换 expo-constants / expo-device / EXPO_PUBLIC_* 为 VITE_*
import { ENVEnums } from '$/enums';
import { StringUtils } from '$/utils';

export const Name = '演我';

export const ENV = {
    get InProd() {
        return import.meta.env.VITE_ENV === 'production';
    },
    get InPreview() {
        return import.meta.env.VITE_ENV === 'preview';
    },
    get InDev() {
        return import.meta.env.VITE_ENV === 'development';
    },
    get InDebug() {
        return import.meta.env.DEV;
    },
    get IsRealDevice() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    get IsGray() {
        return false;
    },
    get IsTest() {
        return !this.InProd;
    },
    get Name() {
        if (this.InProd) return ENVEnums.Name.Prod;
        if (this.InPreview) return ENVEnums.Name.Preview;
        if (this.InDev) return ENVEnums.Name.Dev;
        return ENVEnums.Name.Debug;
    },
    get ApiOrigin() {
        // In dev mode, use Vite proxy to avoid CORS issues
        if (import.meta.env.DEV) {
            return `${window.location.origin}/api`;
        }
        return StringUtils.getDefaultIfEmpty(
            import.meta.env.VITE_API_ORIGIN,
            'https://dev-02.imaginewithu.com',
        );
    },
    get CdnOrigin() {
        return import.meta.env.VITE_CDN_ORIGIN ?? '';
    },
} as const;

export const Version = import.meta.env.VITE_APP_VERSION ?? '1.0.0';
export const BuildCode = import.meta.env.VITE_BUILD_NUMBER ?? '';
export const BuildId = BuildCode;
export const FullVersion = `${Version}${BuildCode ? `(${BuildCode})` : ''}`;

export const FirstRoute = {
    animation: 'fade',
    animationTypeForReplace: 'push',
    animationDuration: 300,
} as const;

export const Scheme = '';
export const Extra = {};
