import type { Fest } from '../@com';
import type { Nullable } from '../nullable';

import type { Exist, Primitive } from './general';

export type SafeError = Partial<Error> | Primitive;

export type Promisable<T = Nullable<Exist>> = Fest.Promisable<T>;

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type TimerHandle = NodeJS.Timeout;

export type ImmediateHandle = NodeJS.Immediate;
