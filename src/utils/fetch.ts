import type { FetchTypes } from '$/types';

export const createURL = (
    href: string,
    search?: FetchTypes.LooseSearchParams | string,
) => {
    const url = new URL(href);
    const searchParams = new URLSearchParams(
        typeof search === 'object'
            ? Object.keys(search).reduce<FetchTypes.SearchParams>(
                  (result, key) => {
                      if (search[key] != null) {
                          result[key] = search[key].toString();
                      }
                      return result;
                  },
                  {},
              )
            : search,
    );
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
    return url;
};

export const isHttpLink = (url: LibTypes.Nullable<string>) => {
    if (url == null) {
        return false;
    }
    const value = url.trim().toLowerCase();
    return value.startsWith('https://') || value.startsWith('http://');
};
