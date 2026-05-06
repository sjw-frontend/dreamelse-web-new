export const approximatelyEqual = (
    a: number,
    b: number,
    fractionDigits = 3,
) => {
    const maxDiff = 0.1 ** fractionDigits;
    return Math.abs(a - b) <= maxDiff;
};

export const fixed = (num: number, fractionDigits?: number) =>
    parseFloat(num.toFixed(fractionDigits));

export const float2percent = (num: number, fractionDigits = 2) =>
    fixed(num * 100, fractionDigits);

export const ms2s = (ms: LibTypes.Nullable<number>, fractionDigits = 5) => {
    const value = (ms ?? 0) / 1000;

    return fixed(value, fractionDigits);
};

export const s2ms = (
    ms: LibTypes.Nullable<number>,
    fractionDigits?: number,
) => {
    const value = (ms ?? 0) * 1000;

    return fixed(value, fractionDigits);
};

export const byte2mb = (byte: number, fractionDigits?: number) => {
    const value = byte / 1000 / 1000;

    return fixed(value, fractionDigits);
};

export const randomIntValue = () => {
    const random = Math.random();
    const len = random.toString().length - 2;
    return Math.floor(random * 10 ** len);
};
