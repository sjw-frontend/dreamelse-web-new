import { getDefaultIfEmpty } from './string';

export const getSafeError = (err: unknown) => {
    if (err == null) {
        return null;
    }

    if (typeof err === 'object') {
        return err as Partial<Error>;
    }

    return new Error(String(err));
};

export const getErrorMsg = (err: unknown) => {
    const safeError = getSafeError(err);

    if (safeError) {
        return String(getDefaultIfEmpty(safeError.message, safeError.msg));
    }

    return undefined;
};
