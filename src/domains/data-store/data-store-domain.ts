// @ts-nocheck
import { BaseDomain, domain } from '$/core';
import { AppError } from '$/errors';
import type { DataStoreTypes } from '$/types';
import { DataStoreUtils, ObjectUtils } from '$/utils';

import { Settings } from './data-store-const';

type InternalState = LibTypes.GeneralObj;

type State = LibTypes.GeneralObj;

type Props = LibTypes.Define<{
    dataSizeLimit?: DataSizeLimit,
}>;

type DataSizeLimit = LibTypes.Define<{
    min: number,
    max: number,
}>;

const StateKey: keyof LibTypes.DefinePick<
    DataStoreTypes.BaseDataItem,
    'state'
> = 'state';

const StateIsDeletedKey: keyof LibTypes.DefinePick<
    DataStoreTypes.BaseState,
    'isDeleted'
> = 'isDeleted';

@domain()
export class DataStoreDomain<
    TState extends LibTypes.Reference,
    TAttrs extends LibTypes.Reference,
> extends BaseDomain<State, InternalState, never, Props> {
    readonly #dataTimestampMap = new Map<DataStoreTypes.DataItemId, number>();

    readonly #dataWeakMap = new Map<
        DataStoreTypes.DataItemId,
        WeakRef<DataStoreTypes.DataItem<TState, TAttrs>>
    >();

    readonly #dataMap = new Map<
        DataStoreTypes.DataItemId,
        DataStoreTypes.DataItem<TState, TAttrs>
    >();

    #clearDataImmediate: LibTypes.ImmediateHandle | null = null;

    #_sizeLimit?: DataSizeLimit;

    get #sizeLimit() {
        this.#_sizeLimit ??= this.#getSizeLimit();
        return this.#_sizeLimit;
    }

    #get(id: DataStoreTypes.DataItemId, refreshTimestamp = true) {
        const data: DataStoreTypes.DataItem<TState, TAttrs> | undefined =
            this.#dataMap.get(id) ?? this.#dataWeakMap.get(id)?.deref();

        if (!data) {
            this.#dataMap.delete(id);
            this.#dataWeakMap.delete(id);
            this.#dataTimestampMap.delete(id);
        } else if (refreshTimestamp) {
            this.#dataTimestampMap.set(id, Date.now());
        }

        return data;
    }

    #setValue<
        K extends LibTypes.WritableKeysDeepOf<
            DataStoreTypes.DataItem<TState, TAttrs>
        >,
    >(
        id: DataStoreTypes.DataItemId,
        keyPath: K,
        value: LibTypes.Get<DataStoreTypes.DataItem<TState, TAttrs>, K>,
    ) {
        const data = this.#get(id);

        if (data) {
            ObjectUtils.setValue(data as LibTypes.GeneralObj, keyPath, value);
        }
    }

    #getSizeLimit() {
        const sizeLimit = {
            ...(this.props.dataSizeLimit ?? Settings.limit),
        };

        if (sizeLimit.min <= 0) {
            sizeLimit.min = Settings.limit.min;
        }

        const minSpan = Settings.limit.max - Settings.limit.min;

        if (sizeLimit.max - sizeLimit.min < minSpan) {
            sizeLimit.max = sizeLimit.min + minSpan;
        }

        return sizeLimit;
    }

    protected override getInitialInternalState(): InternalState {
        return {};
    }

    public readonly setAttr = <
        K extends LibTypes.WritableKeysDeepOf<
            LibTypes.VarOmit<DataStoreTypes.DataItem<TState, TAttrs>, 'state'>
        >,
    >(
        id: DataStoreTypes.DataItemId,
        keyPath: K,
        updaterValue: LibTypes.UpdaterValue<
            LibTypes.Get<DataStoreTypes.DataItem<TState, TAttrs>, K>
        >,
    ) => {
        const key = keyPath.toString().trim();
        if (key === StateKey || key.startsWith(`${StateKey}.`)) {
            return;
        }

        const data = this.#get(id);
        if (data) {
            const value = ObjectUtils.handleUpdaterValue(
                updaterValue,
                ObjectUtils.getValue<
                    LibTypes.GeneralObj,
                    LibTypes.SimpleObjKey
                >(data, keyPath),
            );

            this.#setValue(
                id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                keyPath as LibTypes.WritableKeysDeepOf<
                    DataStoreTypes.DataItem<TState, TAttrs>
                >,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                value as any, // TODO 去掉any
            );
        }
    };

    public readonly setState = <
        K extends LibTypes.WritableKeysOf<
            LibTypes.VarOmitLoose<
                DataStoreTypes.DataItem<TState, TAttrs>['state'],
                typeof StateIsDeletedKey
            >
        >,
    >(
        id: DataStoreTypes.DataItemId,
        key: K & string,
        updaterValue: LibTypes.UpdaterValue<
            DataStoreTypes.DataItem<TState, TAttrs>['state'][K]
        >,
    ) => {
        if (key.trim() === StateIsDeletedKey) {
            return;
        }

        const data = this.#get(id);
        if (data) {
            const fullKeyPath = `${StateKey}.${key}`;
            const value = ObjectUtils.handleUpdaterValue(
                updaterValue,
                ObjectUtils.getValue<LibTypes.GeneralObj, string>(
                    data,
                    fullKeyPath,
                ),
            );

            this.#setValue(
                id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                fullKeyPath as LibTypes.WritableKeysDeepOf<
                    DataStoreTypes.DataItem<TState, TAttrs>
                >,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                value as any, // TODO 去掉any
            );
        }
    };

    public readonly updateState = (
        id: DataStoreTypes.DataItemId,
        updaterValue: LibTypes.UpdaterNewValue<
            DataStoreTypes.DataItem<TState, TAttrs>['state'],
            LibTypes.VarOmitLoose<
                Partial<
                    LibTypes.PickWritable<
                        DataStoreTypes.DataItem<TState, TAttrs>['state']
                    >
                >,
                typeof StateIsDeletedKey
            >
        >,
    ) => {
        const data = this.#get(id);
        if (data) {
            const rawNewState = ObjectUtils.handleUpdaterNewValue(
                updaterValue,
                data.state,
            ) as Partial<DataStoreTypes.BaseState>;

            const newState = {
                ...rawNewState,
            };
            newState.isDeleted = undefined;

            ObjectUtils.safeAssignExcludeUndefined(data.state, newState);
        }
    };

    public readonly delete = (id: DataStoreTypes.DataItemId) => {
        const data = this.#get(id);

        if (data) {
            this.#setValue(
                id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                `${StateKey}.${StateIsDeletedKey}` as LibTypes.WritableKeysDeepOf<
                    DataStoreTypes.DataItem<TState, TAttrs>
                >,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                true as any, // TODO 去掉any
            );
        }
    };

    public readonly create = (
        newData: DataStoreTypes.DataItem<TState, TAttrs>,
    ) => {
        const id = newData.id;
        let data = this.get(id);

        if (data) {
            throw new AppError('已存在相同id的数据');
        }

        DataStoreUtils.proxyReactiveData(newData);

        this.#dataMap.set(id, newData);
        this.#dataWeakMap.set(id, new WeakRef(newData));
        this.#dataTimestampMap.set(id, Date.now());

        clearImmediate(this.#clearDataImmediate);
        this.#clearDataImmediate = setImmediate(() => {
            const size = this.#dataMap.size;
            const sizeLimit = this.#sizeLimit;

            if (size > sizeLimit.max) {
                const list = [...this.#dataMap.values()]
                    .sort((a, b) => {
                        const tsA = this.#dataTimestampMap.get(a.id) ?? 0;
                        const tsB = this.#dataTimestampMap.get(b.id) ?? 0;

                        return tsA - tsB;
                    })
                    .slice(0, size - sizeLimit.min);

                list.forEach(item => {
                    this.#dataMap.delete(item.id);
                });

                [...this.#dataTimestampMap.keys()].forEach(key =>
                    this.#get(key, false));
            }
        });

        data = this.get(id);

        if (!data) {
            throw new AppError('DataStoreDomain upser 未知异常');
        }

        return data;
    };

    public readonly upsert = (
        newData: DataStoreTypes.DataItem<TState, TAttrs>,
    ) => {
        const id = newData.id;
        let data = this.get(id);

        if (!data) {
            data = this.create(newData);
        } else {
            this.updateAttrs(id, newData);
            this.updateState(
                id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                newData.state as LibTypes.VarOmitLoose<
                    Partial<
                        LibTypes.PickWritable<
                            DataStoreTypes.DataItem<TState, TAttrs>['state']
                        >
                    >,
                    typeof StateIsDeletedKey
                >,
            );
        }

        return data;
    };

    public readonly updateAttrs = (
        id: DataStoreTypes.DataItemId,
        rawAttrs: DataStoreTypes.UpdateDataAttrs<TAttrs>,
    ) => {
        const data = this.get(id);

        if (data) {
            const attrs = {
                ...rawAttrs,
            };
            attrs.id = undefined;
            attrs.state = undefined;

            ObjectUtils.safeAssignExcludeUndefined(data, attrs);
        }
    };

    public readonly get = (id: DataStoreTypes.DataItemId) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.#get(id) as
            | LibTypes.FrozenDefine<DataStoreTypes.DataItem<TState, TAttrs>>
            | undefined;
}
