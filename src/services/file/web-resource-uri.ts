const API_ORIGIN = 'https://dev-02.imaginewithu.com';
const CDN_ORIGIN = 'https://cdn-dev-01.imaginewithu.com';

export function rewriteWebResourceUri(uri: string): string {
    if (typeof window === 'undefined' || uri.length === 0) {
        return uri;
    }

    // Support both VITE_ (Vite) and EXPO_PUBLIC_ prefixes
    const apiOrigin = (import.meta as any).env?.VITE_API_ORIGIN ?? process.env.EXPO_PUBLIC_API_ORIGIN;
    if (apiOrigin && uri.startsWith(API_ORIGIN)) {
        return `${apiOrigin}${uri.slice(API_ORIGIN.length)}`;
    }

    const cdnOrigin = (import.meta as any).env?.VITE_CDN_ORIGIN ?? process.env.EXPO_PUBLIC_CDN_ORIGIN;
    if (cdnOrigin && uri.startsWith(CDN_ORIGIN)) {
        return `${cdnOrigin}${uri.slice(CDN_ORIGIN.length)}`;
    }

    return uri;
}
