export type SetNullable<T, K extends keyof T = keyof T> = {
    [p in K]?: T[p] | null;
};
