import type { Fest } from '../@com';

import type { Is2WayExtends, IsExtends } from './is';

export type VerifyExtends<
    A extends IsExtends<A, B> extends true ? B : never,
    B,
> = A;

export type VerifyLooseEqual<
    A extends Is2WayExtends<A, B> extends true ? B : never,
    B,
> = A;

export type VerifyEqual<
    A extends Fest.IsEqual<A, B> extends true ? B : never,
    B,
> = A;
