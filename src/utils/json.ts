// @ts-nocheck
import { configure } from 'safe-stable-stringify';

export const stringify = JSON.stringify;

export const tryStringify = (...args: Parameters<typeof JSON.stringify>) => {
    try {
        return JSON.stringify(...args);
    } catch {
        return null;
    }
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const parse = <T>(...args: Parameters<typeof JSON.parse>) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    JSON.parse(...args) as T;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const tryParse = <T>(...args: Parameters<typeof JSON.parse>) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return JSON.parse(...args) as T;
    } catch {
        return null;
    }
};

const customSafeStringify = configure({
    deterministic: false,
});

/** 该方法生成的json可能会有数据丢失，所以一般仅用于日志存储等不需要再反序列化的场景 */
export const safeStringify = (
    ...args: Parameters<typeof customSafeStringify>
) => {
    try {
        return customSafeStringify(...args);
    } catch {
        return null;
    }
};
