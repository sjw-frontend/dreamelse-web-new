// @ts-nocheck
import { get, set } from 'lodash';

export const getOwnPropertyNamesDeep = (obj: LibTypes.Reference) => {
    const keys = new Set<string>();
    let current: LibTypes.Nullable<LibTypes.Reference> = obj;
    while (current && current.constructor !== Object) {
        Object.getOwnPropertyNames(current).forEach(key => keys.add(key));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        current = Object.getPrototypeOf(
            current,
        ) as LibTypes.Nullable<LibTypes.Reference>;
    }
    return [...keys];
};

export const isShallowEqual = (value1: unknown, value2: unknown) => {
    if (value1 === value2) {
        return true;
    }

    if (
        value1 != null &&
        typeof value1 === 'object' &&
        value2 != null &&
        typeof value2 === 'object'
    ) {
        if (
            value1.constructor === Object &&
            value1.constructor === value2.constructor
        ) {
            const keys1 = Reflect.ownKeys(value1);
            const keys2 = Reflect.ownKeys(value2);
            if (keys1.length !== keys2.length) return false;

            return keys1.every(
                key =>
                    keys2.includes(key) &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    (value1 as LibTypes.VarGeneralObj)[key] ===
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        (value2 as LibTypes.VarGeneralObj)[key],
            );
        } else if (value1 instanceof Array && value2 instanceof Array) {
            if (value1.length !== value2.length) {
                return false;
            }
            return value1.every((val, idx) => val === value2[idx]);
        }
    }

    return false;
};

export const removeUndefinedKeys = (obj: Partial<LibTypes.VarGeneralObj>) => {
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete obj[key];
        }
    });
};

export const mergeExcludeUndefined = <
    T extends LibTypes.Nullable<LibTypes.FrozenGeneralObj>,
>(
    target: T,
    newValue: LibTypes.Nullable<Partial<T>>,
) => {
    newValue && removeUndefinedKeys(newValue);
    return {
        ...target,
        ...newValue,
    };
};

export const assignExcludeUndefined = <T extends LibTypes.FrozenGeneralObj>(
    target: T,
    newValue: LibTypes.Nullable<Partial<T>>,
) => {
    newValue && removeUndefinedKeys(newValue);
    return Object.assign(target, newValue);
};

export const assignDescriptors = <
    T extends LibTypes.FrozenGeneralObj,
    A extends LibTypes.MinLengthArray<
        1,
        LibTypes.Nullable<LibTypes.FrozenGeneralObj>
    >,
>(
    target: T,
    ...args: A
) => {
    args.forEach(item => {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(item));
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return target as unknown as LibTypes.AssignTuple<[T, ...A]>;
};

export const isKey = <T extends LibTypes.Reference>(
    key: PropertyKey,
    obj: T,
): key is keyof T => key in obj;

/** undefined 的值会被忽略 */
export const pickAssign = <
    T extends LibTypes.FrozenGeneralObj,
    K extends LibTypes.Arr<LibTypes.WritableKeysOf<T>>,
>(
    obj: T,
    newObj: Partial<LibTypes.VarPick<T, LibTypes.ValueOf<K>>>,
    keys: K,
) => {
    keys.forEach(k => {
        obj[k] =
            isKey(k, newObj) && newObj[k] !== undefined ? newObj[k] : obj[k];
    });

    return obj;
};

export const safeAssign = <
    A extends LibTypes.GeneralObj,
    B extends LibTypes.GeneralObj,
>(
    target: A,
    newObj: B,
) => {
    const newDescriptors = Object.getOwnPropertyDescriptors(newObj);
    const oldDescriptors = Object.getOwnPropertyDescriptors(target);

    Object.entries(newDescriptors).forEach(([key, newDes]) => {
        const oldDes = oldDescriptors[key];
        if (oldDes?.get && !oldDes.set) {
            return;
        }
        target[key as keyof typeof target] =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            newDes.value as (typeof target)[keyof typeof target];
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return target as LibTypes.Assign<A, B>;
};

export const safeStrictAssign = <T extends LibTypes.FrozenGeneralObj>(
    target: T,
    newObj: Partial<T>,
) => safeAssign(target, newObj);

export const safeAssignExcludeUndefined = <
    A extends LibTypes.FrozenGeneralObj,
    B extends LibTypes.FrozenGeneralObj,
>(
    target: A,
    newObj: B,
) => {
    const newDescriptors = Object.getOwnPropertyDescriptors(newObj);
    const oldDescriptors = Object.getOwnPropertyDescriptors(target);

    Object.entries(newDescriptors).forEach(([key, newDes]) => {
        const oldDes = oldDescriptors[key];
        if (oldDes?.get && !oldDes.set) {
            return;
        }
        if (newDes.value === undefined) {
            return;
        }
        target[key as keyof typeof target] =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            newDes.value as (typeof target)[keyof typeof target];
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return target as LibTypes.Assign<A, B>;
};

export const getValue = <
    O extends LibTypes.Nullable<LibTypes.FrozenGeneralObj>,
    K extends LibTypes.Nullable<LibTypes.Paths<O>>,
>(
    target: O,
    key: K,
) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (key == null || target == null
        ? undefined
        : get(target, key)) as K extends LibTypes.UnExist
        ? undefined
        : LibTypes.Get<O, K & string>;

export const setValue = <
    O extends LibTypes.FrozenGeneralObj,
    K extends LibTypes.Nullable<LibTypes.Paths<O>>,
>(
    target: O,
    key: K,
    value: LibTypes.Get<O, K & string>,
) => {
    if (key != null) {
        set(target, key, value);
    }
};

export const handleUpdaterValue = <T>(
    updaterValue: LibTypes.UpdaterValue<T>,
    prevValue: T,
) =>
    typeof updaterValue === 'function'
        ? (updaterValue as LibTypes.Func<T, [preValue: T]>)(prevValue) // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
        : updaterValue;

export const handleUpdaterNewValue = <TPre, TNew>(
    updaterValue: LibTypes.UpdaterNewValue<TPre, TNew>,
    prevValue: TPre,
) =>
    typeof updaterValue === 'function'
        ? (updaterValue as LibTypes.Func<TNew, [preValue: TPre]>)(prevValue) // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
        : updaterValue;
