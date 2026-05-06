import { type DependencyList, useEffect, useMemo, useRef } from 'react';

import { Reactivity } from '$/reactivity';

type Immediate = Reactivity.WatchImmediate | 'only-recompute';

type InferWatchImmediate<I extends Immediate> = I extends true ? true : false;

type Options<I extends Immediate> = LibTypes.FrozenDefine<
    LibTypes.FrozenOmit<Reactivity.WatchOptions<false>, 'immediate'> & {
        immediate?: I,
    }
>;

export const useWatch = <T, I extends Immediate = undefined>(
    getter: () => T,
    cb: Reactivity.WatchOptionsCallback<T, InferWatchImmediate<I>>,
    ...args:
        | [deps?: DependencyList]
        | [options: Options<I>, deps?: DependencyList]
) => {
    const argFirst = args.at(0);
    const options = argFirst instanceof Array ? undefined : argFirst;

    const argLast = args.at(-1);
    const deps = argLast instanceof Array ? argLast : [];

    const watchHandleRef = useRef<ReturnType<typeof Reactivity.watch>>(null);

    useMemo(() => {
        watchHandleRef.current?.();
        const immediate: boolean | undefined =
            options?.immediate === 'only-recompute'
                ? !watchHandleRef.current
                : options?.immediate;

        watchHandleRef.current = Reactivity.watch(getter, cb, {
            ...options,
            immediate,
        });
    }, deps);

    useEffect(() => () => watchHandleRef.current?.(), []);
};
