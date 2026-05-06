// @ts-nocheck
import type { FetchEnums } from '$/enums';

export declare namespace FetchTypes {
    type Href = string;
    type Method = FetchEnums.Method;
    type StatusCode = FetchEnums.StatusCode;
    type ReqData = LibTypes.FrozenGeneralObj | null;
    type ResData = LibTypes.FrozenGeneralObj | null;
    type Headers = LibTypes.VarGeneralObj<string, string>;
    type Body = BodyInit_;

    type SearchValue = string;
    type LooseSearchValue = number | string;

    type SearchParams<K extends string = string> = LibTypes.VarGeneralObj<
        SearchValue,
        K
    >;
    type LooseSearchParams<K extends string = string> = Partial<
        LibTypes.VarGeneralObj<LooseSearchValue, K>
    >;

    type RequestOptions = Partial<
        LibTypes.Define<
            {
                reqData: ReqData,
                body: Body,
                method: Method,
                headers: Headers,
                timeoutMS: number,
                isLongTask: boolean,
            },
            'headers'
        >
    >;
}
