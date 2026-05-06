// @ts-nocheck
import { randomUUID } from 'expo-crypto';

import { AppName } from './@com';

export const uuid = randomUUID;

export const create = <const T extends string>(key: T) =>
    `${AppName}-${key}` as const;

export const createInner = <const T extends string>(key: T) =>
    `__${AppName}.${key}_` as const;
