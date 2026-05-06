export declare namespace DataStoreTypes {
    type DataItemId = string;

    type BaseState = LibTypes.VarDefine<{
        isDeleted?: boolean,
    }>;

    type BaseDataItem<TState extends LibTypes.Reference = LibTypes.Reference> =
        LibTypes.VarDefine<{
            readonly id: DataItemId,
            readonly isLocal: boolean,
            readonly state: LibTypes.Simplify<BaseState & TState>,
        }>;

    type DataItem<
        TState extends LibTypes.Reference = LibTypes.Reference,
        TAttrs extends LibTypes.Reference = LibTypes.Reference,
    > = LibTypes.VarDefine<BaseDataItem<TState> & TAttrs>;

    type UpdateDataAttrs<
        TAttrs extends LibTypes.Reference = LibTypes.Reference,
    > = Partial<
        LibTypes.VarDefine<
            TAttrs & {
                id?: DataItemId,
                state?: unknown,
            }
        >
    >;

    type ReactiveData<
        TState extends LibTypes.Reference = LibTypes.Reference,
        TAttrs extends LibTypes.Reference = LibTypes.Reference,
    > = LibTypes.VarDefine<
        TAttrs & {
            readonly state: TState,
        }
    >;
}
