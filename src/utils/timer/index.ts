import { TimedTask, type TimedTaskOptions } from './@@com';

// TODO 排查所有调用
export const nextTick = async <T extends LibTypes.Nullable<LibTypes.Asyncable>>(
    cb?: T,
    ...args: T extends LibTypes.Asyncable ? Parameters<T> : []
) => sleep<T>(0, cb, ...args);

export const sleep = async <T extends LibTypes.Nullable<LibTypes.Asyncable>>(
    delay: number,
    cb?: T,
    ...args: T extends LibTypes.Asyncable ? Parameters<T> : []
) => {
    if (delay > 0) {
        await new Promise<void>(r => {
            setTimeout(() => {
                r();
            }, delay);
        });
    } else {
        await Promise.resolve();
    }

    const result = await cb?.(...args);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return result as T extends LibTypes.Asyncable ? ReturnType<T> : undefined;
};

export const getRandomIntervalMS = (
    ...args:
        | readonly [endMS: number]
        | readonly [startMS: number, endMS: number]
) => {
    const startMS = args.at(-2) ?? 0;
    const endMS = args.at(-1);

    if (endMS == null) {
        return 0;
    }

    if (startMS === endMS) {
        return startMS;
    }

    if (startMS > endMS) {
        return 0;
    }

    const ms = Math.floor(Math.random() * (endMS - startMS + 1)) + startMS;

    console.log('getRandomIntervalMS', ms);

    return ms;
};

export type { TimedTask, TimedTaskOptions } from './@@com';

export const createTimedTask = (
    handler: LibTypes.SimpleFunction,
    delayMS: number,
    options: TimedTaskOptions = {},
) => new TimedTask(handler, delayMS, options);
