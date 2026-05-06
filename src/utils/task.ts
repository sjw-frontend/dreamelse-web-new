// @ts-nocheck
import { TimeoutError } from '$/errors';

export const safeRun = <T extends LibTypes.Asyncable>(
    task: T,
    ...args: Parameters<T>
) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return task(...args) as ReturnType<T>;
    } catch (e) {
        console.error(e);
        return null;
    }
};

const mergeTaskMap = new Map<string | symbol, LibTypes.Promisable | null>();

export const merge = async <T extends LibTypes.Asyncable>(
    key: string | symbol,
    task: T,
    ...args: Parameters<T>
) => {
    try {
        const promise =
            mergeTaskMap.get(key) ?? (task(...args) as LibTypes.Promisable);
        mergeTaskMap.set(key, promise);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const result = (await promise) as ReturnType<T>;

        return result;
    } finally {
        mergeTaskMap.delete(key);
    }
};

export const createMergeTask = <T extends LibTypes.Asyncable>(task: T) => {
    const sym = Symbol(`createMergeTask-${task.name}`);
    return async (...args: Parameters<T>) => merge(sym, task, ...args);
};

const serialTaskMap = new Map<string | symbol, LibTypes.Promisable | null>();

export const serial = async <T extends LibTypes.Asyncable>(
    key: string | symbol,
    task: T,
    ...args: Parameters<T>
) => {
    const promise = serialTaskMap.get(key);

    const fn = async () => {
        if (promise) {
            try {
                await promise;
            } catch {}
        }
        return await task(...args);
    };

    const newPromise = fn();
    serialTaskMap.set(key, newPromise);

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const result = (await newPromise) as ReturnType<T>;

        return result;
    } finally {
        serialTaskMap.delete(key);
    }
};

export const createSerialTask = <T extends LibTypes.Asyncable>(task: T) => {
    const sym = Symbol(`createSerialTask-${task.name}`);
    return async (...args: Parameters<T>) => serial(sym, task, ...args);
};

export const getSerialCurrent = (key: string | symbol) =>
    serialTaskMap.get(key);

const mutexTaskMap = new Map<string | symbol, LibTypes.Promisable | null>();

export const mutex = async <T extends LibTypes.Asyncable<void>>(
    key: string | symbol,
    task: T,
    ...args: Parameters<T>
) => {
    let promise = mutexTaskMap.get(key);
    if (promise) {
        return;
    }

    try {
        promise = task(...args);
        mutexTaskMap.set(key, promise);

        await promise;
    } finally {
        mutexTaskMap.delete(key);
    }
};

export const createMutexTask = <T extends LibTypes.Asyncable<void>>(
    task: T,
) => {
    const sym = Symbol(`createMutexTask-${task.name}`);
    return async (...args: Parameters<T>) => mutex(sym, task, ...args);
};

export const runAsyncableOrPromisable = async <
    T extends LibTypes.Asyncable | LibTypes.Promisable,
>(
    task: T,
) => {
    type Result = T extends LibTypes.Func ? Awaited<ReturnType<T>> : Awaited<T>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const p: LibTypes.Promisable = typeof task === 'function' ? task() : task;

    const result = await p;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return result as Result;
};

export const runWithTimeout = async <
    T extends LibTypes.Asyncable | LibTypes.Promisable,
>(
    task: T,
    timeoutMS: LibTypes.Nullable<number>,
) => {
    type Result = T extends LibTypes.Func ? Awaited<ReturnType<T>> : Awaited<T>;

    return new Promise<Result>((resolve, reject) => {
        let timer = null;
        if (timeoutMS != null) {
            timer = setTimeout(() => reject(new TimeoutError()), timeoutMS);
        }
        runAsyncableOrPromisable(task)
            .then(resolve)
            .catch(reject)
            .finally(() => {
                clearTimeout(timer);
            });
    });
};
