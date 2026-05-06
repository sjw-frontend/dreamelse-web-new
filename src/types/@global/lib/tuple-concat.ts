import type { Arr } from './@base/array';

export type TupleConcat<A extends Arr, B extends Arr> = [...A, ...B];
