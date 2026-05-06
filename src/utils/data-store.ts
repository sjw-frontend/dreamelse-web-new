import { Reactivity } from '$/reactivity';
import type { DataStoreTypes } from '$/types';

import { safeAssignExcludeUndefined } from './object';

export const proxyReactiveData = <T extends DataStoreTypes.ReactiveData>(
    data: T,
) => {
    if (!Reactivity.isProxy(data.state)) {
        const stateObj: DataStoreTypes.ReactiveData = {
            state: Reactivity.proxy(data.state),
        };
        safeAssignExcludeUndefined(data, stateObj);
    }

    return data;
};
