// web版：替换 safe-stable-stringify → native JSON
export const stringify = JSON.stringify;

export const tryStringify = (...args: Parameters<typeof JSON.stringify>) => {
    try {
        return JSON.stringify(...args);
    } catch {
        return null;
    }
};

export const parse = <T>(...args: Parameters<typeof JSON.parse>) =>
    JSON.parse(...args) as T;

export const tryParse = <T>(...args: Parameters<typeof JSON.parse>) => {
    try {
        return JSON.parse(...args) as T;
    } catch {
        return null;
    }
};

export const safeStringify = (...args: Parameters<typeof JSON.stringify>) => {
    try {
        return JSON.stringify(...args);
    } catch {
        return null;
    }
};
