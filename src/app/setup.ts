import * as Sentry from '@sentry/react';

// Polyfill setImmediate/clearImmediate for RN-ported code
if (typeof globalThis.setImmediate === 'undefined') {
    (globalThis as any).setImmediate = (fn: () => void) => setTimeout(fn, 0);
    (globalThis as any).clearImmediate = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
}

if (import.meta.env.VITE_ENV === 'production') {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_ENV,
    });
}
