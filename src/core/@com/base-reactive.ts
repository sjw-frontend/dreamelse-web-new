import { AppError } from '$/errors';
import { ListenerLikeCallbackSymbol } from '$/global-symbol';
import { Reactivity } from '$/reactivity';
import type { CoreTypes } from '$/types';
import { TaskUtils } from '$/utils';

import { BaseEntity } from './base-entity';

const BaseReactiveSymbol = Symbol('BaseReactive');

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Handle extends Reactivity.WatchHandle {}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Handle extends LibTypes.ListenerLike {}

export abstract class BaseReactive<
    TEventMap extends LibTypes.BaseEventMap,
    TProps extends CoreTypes.Props,
> extends BaseEntity<TProps, TEventMap> {
    public static readonly BaseReactiveSymbol: typeof BaseReactiveSymbol =
        BaseReactiveSymbol;

    protected isDestroyed = false;

    protected readonly watchHandleList = new Set<Handle>();

    public readonly [BaseReactiveSymbol]: typeof BaseReactiveSymbol =
        BaseReactiveSymbol;

    protected destroy() {
        this.watchHandleList.forEach(item => item());
        this.removeAllEventListeners();
        this.isDestroyed = true;
    }

    protected watch<T, I extends Reactivity.WatchImmediate = undefined>(
        getter: () => T,
        cb: Reactivity.WatchOptionsCallback<T, I>,
        options?: Reactivity.WatchOptions<I>,
    ) {
        // eslint-disable-next-line custom/no-literal-object
        const handleRef: { value: Handle | undefined } = { value: undefined };

        const watchHandle = Reactivity.watch(
            getter,
            (value, oldValue, unwatch) =>
                cb(value, oldValue, () => {
                    unwatch();
                    if (handleRef.value) this.watchHandleList.delete(handleRef.value);
                }),
            options,
        );

        const handle: Handle = () => {
            watchHandle();
            this.watchHandleList.delete(handle);
        };
        handleRef.value = handle;

        handle.stop = () => {
            watchHandle.stop();
            this.watchHandleList.delete(handle);
        };
        handle.resume = () => watchHandle.resume();
        handle.pause = () => watchHandle.pause();
        handle[ListenerLikeCallbackSymbol] = cb;

        this.watchHandleList.add(handle);
        return watchHandle;
    }

    protected async until(
        getter: () => LibTypes.Nullable<boolean>,
        cb?: LibTypes.SimpleFunction,
    ) {
        const result = getter();
        if (!result) {
            await this.untilNext(getter);
        }

        cb && TaskUtils.safeRun(cb);
    }

    protected async untilNext(
        getter: () => LibTypes.Nullable<boolean>,
        cb?: LibTypes.SimpleFunction,
    ) {
        await new Promise<void>((resolve, reject) => {
            try {
                this.watch(getter, (value, _, unwatch) => {
                    if (value) {
                        resolve();
                        unwatch();
                    }
                });
            } catch {
                reject(new AppError('BaseReactive wait 未知异常'));
            }
        });

        cb && TaskUtils.safeRun(cb);
    }
}
