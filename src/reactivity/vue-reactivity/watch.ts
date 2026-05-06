import {
    type ComputedRef,
    type WatchOptions as VWatchOptions,
    type WatchHandle as VueWatchHandle,
    computed,
    isRef,
    watch as vWatch,
} from '@vue/reactivity';
import debounce from 'lodash/debounce';

import { ObjectUtils, TimerUtils } from '$/utils';

export type WatchOptionsCallback<T, I extends WatchImmediate> = (
    newValue: Readonly<T>,
    oldValue: InferCurrentValue<T, I>,
    unwatch: LibTypes.SimpleFunction,
) => void;

export type WatchOptions<T extends WatchImmediate> = LibTypes.Define<
    LibTypes.FrozenPick<VWatchOptions, 'deep' | 'once'> & {
        /** 同步执行回调，否则推迟到下个任务队列中执行 */
        sync?: boolean,
        /** 当deep!==true且sync!==true时，绕过对结果的潜比较，直接执行回调 */
        force?: boolean,
        immediate?: T,
        debounceMS?: number,
    }
>;

export type WatchImmediate = boolean | undefined;

type InferCurrentValue<T, I extends WatchImmediate> = I extends true
    ? Readonly<T> | null
    : Readonly<T>;

export type WatchHandle = VueWatchHandle;

export const watch = <T, I extends WatchImmediate = undefined>(
    getter: ComputedRef<T> | (() => T),
    cb: WatchOptionsCallback<T, I>,
    { deep, once, immediate, sync, force, debounceMS }: WatchOptions<I> = {},
) => {
    const computedObj = isRef(getter) ? getter : computed(getter);
    let oldValue = immediate ? null : computedObj.value;

    let isPending = false;
    let unwatchImmediate = false;

    let watchHandle: WatchHandle | null = null;

    const unwatch = () => {
        if (watchHandle != null) {
            watchHandle();
        } else {
            unwatchImmediate = true;
        }
    };

    let runCount = 0;

    const originalCallback = (newValue: T) => {
        if (immediate && runCount === 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            cb(newValue, oldValue as InferCurrentValue<T, I>, unwatch);
        } else if (
            (typeof deep === 'number' && deep > 1) || // TODO 验证 deep = 0 deep =1 的场景是否符合预期
            deep === true ||
            sync ||
            force
        ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            cb(newValue, oldValue as InferCurrentValue<T, I>, unwatch);
        } else if (!ObjectUtils.isShallowEqual(oldValue, newValue)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            cb(newValue, oldValue as InferCurrentValue<T, I>, unwatch);
        }

        oldValue = newValue;
        runCount++;
    };

    const callback =
        debounceMS == null
            ? originalCallback
            : debounce(originalCallback, debounceMS);

    watchHandle = vWatch(computedObj, callback, {
        deep,
        once,
        immediate,
        scheduler: job => {
            if (sync) {
                job();
                return;
            }
            if (!isPending) {
                isPending = true;
                TimerUtils.nextTick(() => {
                    isPending = false;
                    job();
                });
            }
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    unwatchImmediate && watchHandle();
    return watchHandle;
};
