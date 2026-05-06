// web版：替换 expo-linking → Web URL API
import { LINKING } from '$/consts';
import { BaseService, service } from '$/core';
import type { LinkingTypes } from '$/types';

@service()
export class LinkingService extends BaseService {
    public constructor() {
        super();
    }

    public readonly open = async (url: string) => {
        window.open(url, '_blank');
    };

    public readonly canOpen = async (_url: string) => true;

    public readonly addLinkingListener = (_event: string, _handler: (url: string) => void) => ({
        remove: () => {},
    });

    public readonly getInitialUrl = async () => window.location.href;

    public readonly getDeepLink = <
        T extends LibTypes.ValueOf<typeof LINKING.RouteSchemes>,
    >(
        path: T['path'],
        ...args: LibTypes.OptionalArgumentsIfAllow<
            [search: NoInfer<LinkingTypes.ParseSearchParams<T>>]
        >
    ) => {
        const [search] = args;
        const params = new URLSearchParams();
        if (search) {
            Object.entries(search).forEach(([key, value]) => {
                if (value != null) params.set(key, String(value));
            });
        }
        const query = params.toString();
        return `${window.location.origin}/${path}${query ? `?${query}` : ''}`;
    };

    public readonly openEmail = async (email: string) => {
        try {
            window.open(`mailto:${email}`);
            return true;
        } catch {
            return false;
        }
    };
}
