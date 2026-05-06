// @ts-nocheck
import {
    type QueryParams,
    addEventListener,
    canOpenURL,
    createURL,
    getInitialURL,
    openURL,
} from 'expo-linking';

import { LINKING } from '$/consts';
import { BaseService, service } from '$/core';
import type { LinkingTypes } from '$/types';

@service()
export class LinkingService extends BaseService {
    public constructor() {
        super();
        getInitialURL().then(url => {
            this.#initialUrl = url;
        });
    }

    #initialUrl?: string | null;

    public readonly open = openURL;
    public readonly canOpen = canOpenURL;

    public readonly addLinkingListener = addEventListener;

    public readonly getInitialUrl = async () => {
        if (this.#initialUrl !== undefined) {
            return this.#initialUrl;
        }

        return getInitialURL();
    };

    public readonly getDeepLink = <
        T extends LibTypes.ValueOf<typeof LINKING.RouteSchemes>,
    >(
        path: T['path'],
        ...args: LibTypes.OptionalArgumentsIfAllow<
            [search: NoInfer<LinkingTypes.ParseSearchParams<T>>]
        >
    ) => {
        const [search] = args;

        const queryParams: QueryParams = {};
        search &&
            Object.entries(search).forEach(([key, value]) => {
                queryParams[key] = value?.toString();
            });

        const url = createURL(path, { queryParams });

        return url;
    };

    public readonly openEmail = async (email: string) => {
        const mailtoLink = `${LINKING.Protocols.Email}${email}` as const;
        try {
            const canOpen = await this.canOpen(mailtoLink);
            if (!canOpen) {
                return false;
            }

            await this.open(mailtoLink);
            return true;
        } catch {
            return false;
        }
    };
}
