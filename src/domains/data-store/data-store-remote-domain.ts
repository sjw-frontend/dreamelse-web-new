// @ts-nocheck
import { cloneDeep } from 'lodash';

import { BaseDomain, domain } from '$/core';
import { AppError } from '$/errors';
import type { DataStoreTypes } from '$/types';
import { DataStoreUtils, MapUtils, ObjectUtils, TaskUtils } from '$/utils';

import { Settings } from './data-store-const';

type InternalState = LibTypes.GeneralObj;

type State = LibTypes.GeneralObj;

type Props<
    TState extends LibTypes.Reference,
    TAttrs extends LibTypes.Reference,
> = LibTypes.Define<{
    requestUpdateToRemote?: LibTypes.Asyncable<
        void,
        [data: LibTypes.FrozenDefine<DataStoreTypes.DataItem<TState, TAttrs>>]
    >,
    requestDeleteToRemote?: LibTypes.Asyncable<
        void,
        [data: LibTypes.FrozenDefine<DataStoreTypes.DataItem<TState, TAttrs>>]
    >,

    dataSizeLimit?: DataSizeLimit,
}>;

type DataSizeLimit = LibTypes.Define<{
    min: number,
    max: number,
}>;

type RequestUpdateInfo<
    TState extends LibTypes.Reference,
    TAttrs extends LibTypes.Reference,
> = LibTypes.VarDefine<{
    promise: Promise<unknown> | null,
    promiseResolve: LibTypes.SimpleFunction | null,
    timer: LibTypes.TimerHandle | null,
    snapshot: DataStoreTypes.DataItem<TState, TAttrs> | null,
}>;

let dataStoreId = 0;

const StateKey: keyof LibTypes.DefinePick<
    DataStoreTypes.BaseDataItem,
    'state'
> = 'state';

const StateIsDeletedKey: keyof LibTypes.DefinePick<
    DataStoreTypes.BaseState,
    'isDeleted'
> = 'isDeleted';

@domain()
export class DataStoreRemoteDomain<
    TState extends LibTypes.Reference,
    TAttrs extends LibTypes.Reference,
> extends BaseDomain<State, InternalState, never, Props<TState, TAttrs>> {
    readonly #dataStoreId = `${dataStoreId++}`;

    readonly #requestUpdateInfoMap = new Map<
        DataStoreTypes.DataItemId,
        RequestUpdateInfo<TState, TAttrs>
    >();

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

    #getRequestUpdateToRemoteKey(id: DataStoreTypes.DataItemId) {
        return `_DataStoreRemoteDomain-${this.#dataStoreId}-requestUpdateToRemote-[${id}]_`;
    }

    async #requestUpdateToRemote(id: DataStoreTypes.DataItemId) {
        const requestKey = this.#getRequestUpdateToRemoteKey(id);

        return TaskUtils.serial(requestKey, async () => {
            try {
                const data = this.get(id);
                if (data) {
                    await this.props.requestUpdateToRemote?.(data);
                }
            } catch {
                const snapshot = this.#requestUpdateInfoMap.get(id)?.snapshot;
                const data = this.get(id);

                if (snapshot && data) {
                    const state = ObjectUtils.safeAssign(
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        (data as unknown as DataStoreTypes.DataItem).state,
                        snapshot.state,
                    );
                    ObjectUtils.safeAssign(data, {
                        ...snapshot,
                        id,
                        state,
                    });
                }
            } finally {
                this.#requestUpdateInfoMap.get(id)?.promiseResolve?.();
                this.#requestUpdateInfoMap.delete(id);
            }
        });
    }

    #updateToRemote(
        id: DataStoreTypes.DataItemId,
        setter: LibTypes.SimpleFunction,
    ) {
        const data = this.#get(id);
        const requestUpdateInfo = MapUtils.getOrDefault(
            this.#requestUpdateInfoMap,
            id,
            (() => {
                let promiseResolve = null;
                const promise = new Promise(resolve => {
                    promiseResolve = resolve;
                });
                return {
                    promise,
                    promiseResolve,
                    timer: null,
                    snapshot: (data && cloneDeep(data)) ?? null,
                };
            })(),
        );

        if (!data) {
            requestUpdateInfo.promiseResolve?.();
            this.#requestUpdateInfoMap.delete(id);
            return;
        }

        clearTimeout(requestUpdateInfo.timer);
        requestUpdateInfo.timer = setTimeout(() => {
            this.#requestUpdateToRemote(id);
        }, Settings.requestUpdateToRemoteDelayMS);

        setter();
    }

    async #submitUpdate(
        id: DataStoreTypes.DataItemId,
        setter: LibTypes.SimpleFunction,
        submitToRemote: boolean | undefined,
    ) {
        const data = this.#get(id);

        if (data) {
            const { requestUpdateToRemote } = this.props;
            const requestKey = this.#getRequestUpdateToRemoteKey(id);

            if (
                !submitToRemote ||
                data.isLocal === true ||
                !requestUpdateToRemote
            ) {
                const serialCurrent = TaskUtils.getSerialCurrent(requestKey);
                const promise = this.#requestUpdateInfoMap.get(id)?.promise;
                if (serialCurrent) {
                    await serialCurrent;
                }
                if (promise) {
                    await promise;
                }
                setter();
            } else {
                await TaskUtils.serial(requestKey, () =>
                    this.#updateToRemote(id, setter));
            }
        }
    }

    async #setValue<
        K extends LibTypes.WritableKeysDeepOf<
            DataStoreTypes.DataItem<TState, TAttrs>
        >,
    >(
        id: DataStoreTypes.DataItemId,
        keyPath: K,
        value: LibTypes.Get<DataStoreTypes.DataItem<TState, TAttrs>, K>,
        submitToRemote: boolean | undefined,
    ) {
        const data = this.#get(id);

        if (data) {
            await this.#submitUpdate(
                id,
                () => {
                    ObjectUtils.setValue(
                        data as LibTypes.GeneralObj,
                        keyPath,
                        value,
                    );
                },
                submitToRemote,
            );
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

    /** @internal 内部api */
    public readonly setAttrSync = <
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
            ObjectUtils.setValue(
                data as LibTypes.GeneralObj,
                keyPath,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                value as any,
            );
        }
    };

    public readonly setAttr = async <
        K extends LibTypes.WritableKeysDeepOf<
            LibTypes.VarOmit<DataStoreTypes.DataItem<TState, TAttrs>, 'state'>
        >,
    >(
        id: DataStoreTypes.DataItemId,
        keyPath: K,
        updaterValue: LibTypes.UpdaterValue<
            LibTypes.Get<DataStoreTypes.DataItem<TState, TAttrs>, K>
        >,
        submitToRemote?: boolean,
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

            await this.#setValue(
                id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                keyPath as LibTypes.WritableKeysDeepOf<
                    DataStoreTypes.DataItem<TState, TAttrs>
                >,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                value as any, // TODO 去掉any
                submitToRemote,
            );
        }
    };

    public readonly setState = async <
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
        submitToRemote?: boolean,
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

            await this.#setValue(
                id,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                fullKeyPath as LibTypes.WritableKeysDeepOf<
                    DataStoreTypes.DataItem<TState, TAttrs>
                >,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                value as any, // TODO 去掉any
                submitToRemote,
            );
        }
    };

    public readonly updateState = async (
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
        submitToRemote?: boolean,
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

            await this.#submitUpdate(
                id,
                () => {
                    ObjectUtils.safeAssignExcludeUndefined(
                        data.state,
                        newState,
                    );
                },
                submitToRemote,
            );
        }
    };

    public readonly delete = async (
        id: DataStoreTypes.DataItemId,
        submitToRemote?: boolean,
    ) => {
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
                false,
            );

            if (
                submitToRemote &&
                this.props.requestDeleteToRemote &&
                data.isLocal !== true
            ) {
                await this.props.requestDeleteToRemote(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    data as LibTypes.FrozenDefine<
                        DataStoreTypes.DataItem<TState, TAttrs>
                    >,
                );
            }
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

    public readonly upsert = async (
        newData: DataStoreTypes.DataItem<TState, TAttrs>,
    ) => {
        const id = newData.id;
        let data = this.get(id);

        if (!data) {
            data = this.create(newData);
        } else {
            await Promise.all([
                this.updateAttrs(id, newData),
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
                ),
            ]);
        }

        return data;
    };

    public readonly updateAttrs = async (
        id: DataStoreTypes.DataItemId,
        rawAttrs: DataStoreTypes.UpdateDataAttrs<TAttrs>,
        submitToRemote?: boolean,
    ) => {
        const data = this.get(id);

        if (data) {
            const attrs = {
                ...rawAttrs,
            };
            attrs.id = undefined;
            attrs.state = undefined;

            await this.#submitUpdate(
                id,
                () => {
                    ObjectUtils.safeAssignExcludeUndefined(data, attrs);
                },
                submitToRemote,
            );
        }
    };

    public readonly get = (id: DataStoreTypes.DataItemId) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.#get(id) as
            | LibTypes.FrozenDefine<DataStoreTypes.DataItem<TState, TAttrs>>
            | undefined;
}
