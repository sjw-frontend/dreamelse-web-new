import {
    type DependencyList,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { Reactivity } from '$/reactivity';

type Callback<T> = (
    newValue: Readonly<T>,
    oldValue: Readonly<T> | null,
) => void;

type Options = LibTypes.FrozenPick<
    Reactivity.WatchOptions<true>,
    'debounceMS' | 'deep' | 'force' | 'sync'
>;

const isOptions = (arg: unknown): arg is Options =>
    arg != null && typeof arg !== 'function' && !(arg instanceof Array);

export const useReactive = <T>(
    getter: () => T,
    ...args:
        | [cb: Callback<T>, deps?: DependencyList]
        | [cb: Callback<T>, options?: Options, deps?: DependencyList]
        | [deps?: DependencyList]
        | [options?: Options, deps?: DependencyList]
) => {
    const [arg1, arg2] = args;

    const cb = typeof arg1 === 'function' ? arg1 : null;
    const { deep, sync, force } = isOptions(arg1)
        ? arg1
        : isOptions(arg2)
          ? arg2
          : {};

    const argLast = args.at(-1);
    const deps = argLast instanceof Array ? argLast : [];

    const computedObj = useMemo(() => Reactivity.computed(getter), deps);
    const [state, setState] = useState(() => {
        const value = computedObj.value;
        cb?.(value, null);
        return { value };
    });

    const watchHandleRef = useRef<ReturnType<typeof Reactivity.watch>>(null);

    useMemo(() => {
        watchHandleRef.current?.();
        const immediate = !!watchHandleRef.current;
        watchHandleRef.current = Reactivity.watch(
            computedObj,
            (newValue, oldValue) => {
                setState({ value: newValue });
                cb?.(newValue, oldValue);
            },
            {
                deep,
                sync,
                force,
                immediate,
            },
        );
    }, deps);

    useEffect(() => () => watchHandleRef.current?.(), []);

    return state.value;
};
