import { AppError } from '$/errors';
import { Reactivity } from '$/reactivity';
import type { CoreTypes } from '$/types';
import { EventUtils } from '$/utils';

type Props<T> = LibTypes.Simplify<
    Readonly<LibTypes.InferGeneralObjDefaultTypeParamIgnoreNever<T>>
>;

const CurrentZoneSymbol = Symbol('CurrentZone');
const ZoneGetterSymbol = Symbol('ZoneGetter');
const PropsGetterSymbol = Symbol('propsGetter');
const CurrentPropsSymbol = Symbol('currentProps');
const BaseEntitySymbol = Symbol('BaseEntity');

// const refMap = new Map<
//     string,
//     WeakRef<BaseEntity<CoreTypes.Props, LibTypes.BaseEventMap>>
// >();

// setInterval(() => {
//     const list = [...refMap.entries()].map(([key, ref]) => ({
//         key,
//         ref,
//         unRelease: !!ref.deref(),
//     }));
//     console.log('====[GC]创建过的Entity====', list.length, list);

//     const unreleaseList = list.filter(item => item.unRelease);
//     console.log(
//         '====[GC]未回收的Entity====',
//         unreleaseList.length,
//         unreleaseList,
//     );
// }, 5000);

export abstract class BaseEntity<
    TProps extends CoreTypes.Props,
    TEventMap extends LibTypes.BaseEventMap,
> {
    public static readonly ZoneGetterSymbol: typeof ZoneGetterSymbol =
        ZoneGetterSymbol;

    public static [CurrentZoneSymbol]?: CoreTypes.Zone;

    public static readonly CurrentZoneSymbol: typeof CurrentZoneSymbol =
        CurrentZoneSymbol;

    public static readonly PropsGetterSymbol: typeof PropsGetterSymbol =
        PropsGetterSymbol;

    public static readonly BaseEntitySymbol: typeof BaseEntitySymbol =
        BaseEntitySymbol;

    public static [CurrentPropsSymbol] = {};

    public static readonly CurrentPropsSymbol: typeof CurrentPropsSymbol =
        CurrentPropsSymbol;

    public constructor() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.#zone = (this.constructor as typeof BaseEntity)[CurrentZoneSymbol];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.#props = (this.constructor as typeof BaseEntity)[
            CurrentPropsSymbol
        ] as Props<TProps>;

        Reactivity.markRaw(this);

        // const weakRef = new WeakRef(this);
        // refMap.set(
        //     `${this.constructor.name}-${KeyUtils.uuid()}-${Date.now()}`,
        //     weakRef,
        // );
    }

    readonly #zone?: CoreTypes.Zone;
    readonly #props;
    readonly #ts = Date.now();

    #eventsDefine?: ReturnType<typeof EventUtils.define<TEventMap>>;

    protected readonly emitEvent = this.#events.emitEvent;
    protected readonly emitEventEnsureReceived =
        this.#events.emitEventEnsureReceived;

    public readonly addEventListener = this.#events.addEventListener;
    public readonly removeEventListener = this.#events.removeEventListener;
    public readonly removeAllEventListeners =
        this.#events.removeAllEventListeners;

    public readonly [BaseEntitySymbol]: typeof BaseEntitySymbol =
        BaseEntitySymbol;

    get #events() {
        this.#eventsDefine ??= EventUtils.define<TEventMap>();
        return this.#eventsDefine;
    }

    /**
     * - 尽可能少用props
     * - 一般只用于传必要的初始化参数，如id。
     * - 不要传其它由本框架管理的实例，如controller和service
     */
    protected get props() {
        return this.#props;
    }

    protected get ts() {
        return this.#ts;
    }

    protected get [ZoneGetterSymbol]() {
        if (!this.#zone) {
            throw new AppError('找不到zone,该实例是非法构造的！');
        }

        return this.#zone;
    }

    public get [PropsGetterSymbol]() {
        return this.props;
    }
}
