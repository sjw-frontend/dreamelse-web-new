// @ts-nocheck
import { RouterEnums } from '$/enums';
import type { FileTypes, LinkingTypes } from '$/types';

import * as ASSETS from './assets';

export const UniversalLinkPrefix = 'https://public.cdn.work/html';

export const Protocols = {
    DeepLink: 'myapp:',
    UniversalLink: 'https:',
    Email: 'mailto:',
} as const;

export const RouteSchemes = {
    Home: {
        path: RouterEnums.RouteName.Home,
        searchKeys: ['evt'],
    },
} as const satisfies LibTypes.FrozenGeneralObj<LinkingTypes.RouteScheme>;

export type ShareApp = LibTypes.FrozenDefine<{
    name: string,
    scheme: string,
    icon: FileTypes.RequireMediaAsset,
    getShareUrl: (link: string, text: string) => string,
}>;

export const ShareApps = [
    {
        name: 'Tiktok',
        scheme: 'snssdk1233://',
        icon: ASSETS.ShareApp.tiktok,
        getShareUrl: (_link, _text) => 'snssdk1233://',
    },
    {
        name: 'Twitter',
        scheme: 'twitter://',
        icon: ASSETS.ShareApp.x,
        getShareUrl: (link, text) =>
            `twitter://post?message=${encodeURIComponent(`${text} ${link}`)}`,
    },
    {
        name: 'Facebook',
        scheme: 'fb://',
        icon: ASSETS.ShareApp.fb,
        getShareUrl: link => `fb://share?href=${encodeURIComponent(link)}`,
    },
    {
        name: 'Instagram',
        scheme: 'instagram://',
        icon: ASSETS.ShareApp.ins,
        getShareUrl: link =>
            `instagram://library?AssetPath=${encodeURIComponent(link)}`,
    },
    {
        name: 'YouTube',
        scheme: 'youtube://',
        icon: ASSETS.ShareApp.ytb,
        getShareUrl: (link, text) =>
            `youtube:///upload?description=${encodeURIComponent(`${text} ${link}`)}`,
    },
] as const satisfies LibTypes.Arr<ShareApp>;
