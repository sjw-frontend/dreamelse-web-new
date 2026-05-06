import { Reactivity } from '$/reactivity';
import type { CoreTypes } from '$/types';
import { ObjectUtils, TimerUtils } from '$/utils';

import { BaseReactive } from '../@com';

const BaseModelSymbol = Symbol('BaseModel');
const UpdateInternalSymbol = Symbol('updateInternal');
const InternalStateSymbol = Symbol('InternalState');
const ReportInstanceSymbol = Symbol('ReportInstance');

type State<TState, TPresetsState> = LibTypes.Simplify<
    LibTypes.ReadonlyDeep<
        LibTypes.Assign<
            LibTypes.Assign<
                LibTypes.InferGeneralObjDefaultTypeParam<TState>,
                LibTypes.InferGeneralObjDefaultTypeParam<TPresetsState>
            >,
            CoreTypes.ModelPresetsState
        >
    >
>;

type InternalState<TInternalState, TPresetsState> = LibTypes.Simplify<
    LibTypes.Assign<
        LibTypes.Assign<
            LibTypes.InferGeneralObjDefaultTypeParam<TInternalState>,
            LibTypes.InferGeneralObjDefaultTypeParam<TPresetsState>
        >,
        CoreTypes.ModelPresetsState
    >
>;

export abstract class BaseModel<
    TState extends CoreTypes.ModelState,
    TInternalState extends TState,
    TEventMap extends LibTypes.BaseEventMap,
    TProps extends CoreTypes.Props,
    TPresetsState extends LibTypes.FrozenGeneralObj,
> extends BaseReactive<TEventMap, TProps> {
    public static readonly [BaseModelSymbol]: typeof BaseModelSymbol =
        BaseModelSymbol;

    public static readonly UpdateInternalSymbol: typeof UpdateInternalSymbol =
        UpdateInternalSymbol;

    public static readonly InternalStateSymbol: typeof InternalStateSymbol =
        InternalStateSymbol;

    public static readonly ReportInstanceSymbol: typeof ReportInstanceSymbol =
        ReportInstanceSymbol;

    // TODO protected
    public constructor() {
        super();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.#internal = Reactivity.proxy(
            this.getInitialInternalState(),
        ) as InternalState<TInternalState, TPresetsState>;
    }

    protected abstract getInitialInternalState(): TInternalState;

    readonly #internal;

    public [ReportInstanceSymbol]?: CoreTypes.Report;

    public readonly [BaseModelSymbol]: typeof BaseModelSymbol = BaseModelSymbol;

    protected get internal() {
        return this.#internal;
    }

    public get [InternalStateSymbol]() {
        return this.#internal;
    }

    /** 可用于useReactive和useWatch */
    public get state() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return this.#internal as State<TState, TPresetsState>;
    }

    protected override destroy() {
        super.destroy();
        // TODO 后续评估是否要开启
        // this.#internal = Reactivity.toRaw(this.#internal);
    }

    protected resetInternalState(
        override: Partial<
            LibTypes.PickWritable<InternalState<TInternalState, TPresetsState>>
        > = {},
    ) {
        ObjectUtils.removeUndefinedKeys(override);
        const newInternalState = Object.assign(
            this.getInitialInternalState(),
            override,
        );
        ObjectUtils.safeAssign(this.internal, newInternalState);
    }

    protected setPending(pending: boolean) {
        (this.internal as CoreTypes.ModelPresetsState).pending = pending;
    }

    protected async transition(
        task: LibTypes.Promisable | LibTypes.SimpleAsyncable,
    ) {
        try {
            this.setPending(true);
            await (typeof task === 'function' ? task() : task);
        } finally {
            TimerUtils.nextTick(() => {
                this.setPending(false);
            });
        }
    }

    public [UpdateInternalSymbol](
        newInternal: Partial<InternalState<TInternalState, TPresetsState>>,
    ) {
        Object.assign(this.internal, newInternal);
    }
}
