// @ts-nocheck
import { canOpenURL } from 'expo-linking';
import { Share } from 'react-native';

import { LINKING } from '$/consts';
import { BaseService, service } from '$/core';

@service()
export class ShareService extends BaseService {
    public readonly openPlatformShare = Share.share.bind(Share);

    public readonly getCanShareApps = async () => {
        const installedApps = await Promise.all(
            LINKING.ShareApps.map(
                async app =>
                    ({
                        ...app,
                        installed: await canOpenURL(app.scheme).catch(
                            () => false,
                        ),
                    }) as const,
            ),
        );
        return installedApps.filter(app => app.installed);
    };
}
