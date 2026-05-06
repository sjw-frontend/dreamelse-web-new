// web版：替换 expo-linking / react-native Share → Web Share API
import { LINKING } from '$/consts';
import { BaseService, service } from '$/core';

@service()
export class ShareService extends BaseService {
    public readonly openPlatformShare = async (options: { title?: string; message?: string; url?: string }) => {
        if (navigator.share) {
            await navigator.share(options);
        } else if (options.url) {
            await navigator.clipboard.writeText(options.url);
        }
    };

    public readonly getCanShareApps = async () =>
        LINKING.ShareApps.map(app => ({ ...app, installed: false }));

    public readonly shareToApp = async (_appScheme: string, _url: string, _text: string) => false;
}
