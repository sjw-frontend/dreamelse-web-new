type InferMapKey<T extends Map<unknown, unknown>> =
    T extends Map<infer K, unknown> ? K : never;

type InferMapValue<T extends Map<unknown, unknown>> =
    T extends Map<unknown, infer V> ? V : never;

export const getOrDefault = <T extends Map<unknown, unknown>>(
    map: T,
    key: InferMapKey<T>,
    defaultValue: InferMapValue<T>,
) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const value = (map.get(key) ?? defaultValue) as InferMapValue<T>;
    map.set(key, value);
    return value;
};
