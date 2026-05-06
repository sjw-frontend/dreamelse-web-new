// web版：替换 expo-crypto → Web Crypto API
import { AppName } from './@com';

export const uuid = () => crypto.randomUUID();

export const create = <const T extends string>(key: T) =>
    `${AppName}-${key}` as const;

export const createInner = <const T extends string>(key: T) =>
    `__${AppName}.${key}_` as const;
