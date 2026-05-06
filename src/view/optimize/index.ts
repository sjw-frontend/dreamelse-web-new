import { memo } from 'react';
import type { ReactTypes } from '$/types';

export const optimize = <T extends ReactTypes.FCForExtends>(
    Component: T,
    options?: LibTypes.Define<{
        memo?: Parameters<typeof memo<T>>[1] | false;
    }>,
) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (options?.memo === false ? Component : memo(Component, options?.memo)) as T;
