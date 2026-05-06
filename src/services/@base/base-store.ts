// @ts-nocheck
import { BaseService } from '$/core';
import { JSONUtils, KeyUtils, StringUtils } from '$/utils';

type StoreInfo = LibTypes.FrozenDefine<{
    value: string,
    expiry: number | null,
    version: string | undefined,
}>;

type Storage<TKeys extends string> = LibTypes.Define<{
    setItem: (key: string, value: string) => Promise<void>,
    getItem: (key: string) => Promise<string | null>,
    removeItem: (key: string) => Promise<void>,
    versions: Partial<LibTypes.GeneralObj<string, TKeys>>,
}>;

export abstract class BaseStoreService<
    TJsonValues extends LibTypes.Simplify<
        LibTypes.OverrideIfNonSubObject<
            TJsonValues,
            LibTypes.VarGeneralObj<Exclude<LibTypes.JsonValue, string>, TKeys>
        >
    >,
    TKeys extends string,
> extends BaseService {
    protected constructor(storage: Storage<TKeys>) {
        super();
        this.#storage = {
            setItem: async (key, value) =>
                storage.setItem(this.#createKey(key), value),
            getItem: async key => storage.getItem(this.#createKey(key)),
            removeItem: async key => storage.removeItem(this.#createKey(key)),
            versions: storage.versions,
        };
    }

    public abstract readonly Keys: LibTypes.FrozenGeneralObj<TKeys>;

    readonly #storage: Storage<TKeys>;

    #createKey(key: string) {
        return KeyUtils.createInner(key);
    }

    async #set(
        key: TKeys,
        value: string,
        /** ms */
        maxAge?: number,
    ) {
        const info: StoreInfo = {
            value,
            expiry: maxAge == null ? null : Date.now() + maxAge,
            version: this.#storage.versions[key] ?? undefined,
        };

        const stringifyInfo = JSONUtils.tryStringify(info);

        stringifyInfo != null &&
            (await this.#storage.setItem(key, stringifyInfo));
    }

    async #get(key: TKeys) {
        const result = await this.#storage.getItem(key);
        if (result == null) {
            return null;
        }

        const info = JSONUtils.tryParse<StoreInfo>(result);
        if (!info) {
            return null;
        }

        if (info.expiry != null && Date.now() > info.expiry) {
            this.remove(key);
            return null;
        }

        if (info.version !== this.#storage.versions[key]) {
            this.remove(key);
            return null;
        }

        return info.value;
    }

    public readonly remove = async (key: TKeys) =>
        this.#storage.removeItem(key);

    public readonly set = async (
        key: Exclude<TKeys, keyof TJsonValues>,
        value: string,
        /** ms */
        maxAge?: number,
    ) => this.#set(key, value, maxAge);

    public readonly get = async (key: Exclude<TKeys, keyof TJsonValues>) =>
        this.#get(key);

    public setJSON = async <P extends keyof TJsonValues>(
        key: P & TKeys,
        obj: TJsonValues[P],
        maxAge?: number,
    ) => {
        const value = JSONUtils.tryStringify(obj);
        !StringUtils.isEmpty(value) && (await this.#set(key, value, maxAge));
    };

    public getJSON = async <P extends keyof TJsonValues>(key: P & TKeys) => {
        const value = await this.#get(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }

        return JSONUtils.tryParse<TJsonValues[P]>(value);
    };
}
