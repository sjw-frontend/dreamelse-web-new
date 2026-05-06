import type { Arr } from './@base/array';
import type { Constructor } from './@base/class';
import type { Exist } from './@base/general';

export type ConstructorTupleToInstance<
    TConstructors extends Arr<Constructor>,
    TUnion = Exist,
> = {
    [p in keyof TConstructors]: TConstructors[p] extends Constructor
        ? InstanceType<TConstructors[p]> & TUnion
        : never;
};
