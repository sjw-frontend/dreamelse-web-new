export const isEqualIgnoreCase = (s1: string, s2: string) =>
    s1.toLowerCase() === s2.toLowerCase();

export const isEmpty = <T extends LibTypes.Nullable<string>>(
    s: T,
): s is LibTypes.Nullable<''> & T => {
    if (s == null) {
        return true;
    }

    return s === '';
};

export const getDefaultIfEmpty = <
    T extends LibTypes.Nullable<string>,
    D extends LibTypes.Nullable<string>,
>(
    s: T,
    def: LibTypes.Or<
        LibTypes.IsExtends<null, T>,
        LibTypes.IsExtends<undefined, T>
    > extends true
        ? D
        : LibTypes.IsExtends<'', T> extends true
          ? D
          : never,
): D | Exclude<T, LibTypes.Nullable<''>> => {
    if (isEmpty(s)) {
        return def;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return s as Exclude<T, LibTypes.Nullable<''>>;
};

export const validatePhoneNumber = (phone: string) => {
    const regex = /^1[3-9]\d{9}$/;
    return regex.test(phone);
};
