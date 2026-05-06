import { type DependencyList, useEffect } from 'react';

import type { CoreTypes } from '$/types';

export const useListenEvent = <
    T extends CoreTypes.Entity,
    E extends keyof CoreTypes.InferEventMap<T>,
>(
    ctrl: T | null,
    eventName: E,
    listener: CoreTypes.InferEventMap<T>[E],
    deps: DependencyList = [],
) => {
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        ctrl?.addEventListener(eventName as LibTypes.BaseEventName, listener);

        return () => {
            ctrl?.removeEventListener(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                eventName as LibTypes.BaseEventName,
                listener,
            );
        };
    }, [ctrl, ...deps]);
};
