import { useMemo, useRef } from 'react';

export const useRefFactory = <T>(factory: () => T) => {
    const value = useMemo(factory, []);
    return useRef(value);
};
