// @ts-nocheck
import { useMemo } from 'react';
import type { ViewProps } from 'react-native';

export const useShowStyle = (show: boolean) =>
    useMemo(
        () =>
            show
                ? null
                : ({
                      display: 'none',
                  } satisfies ViewProps['style']),
        [show],
    );
