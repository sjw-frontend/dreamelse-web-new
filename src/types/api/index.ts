import type { ApiEnums } from '$/enums';

import type { FetchTypes } from '../fetch';

export declare namespace ApiTypes {
    type Code = ApiEnums.ErrorCode | ApiEnums.SuccessCode;
    type UrlPath = string;
    type ReqData = FetchTypes.ReqData;
    type ResData = FetchTypes.ResData;

    type ResponseRaw<T extends ResData = ResData> = LibTypes.FrozenDefine<
        | {
              code: ApiEnums.ErrorCode,
              msg: string | undefined,
          }
        | {
              code: ApiEnums.SuccessCode,
              data: T,
              msg?: string,
          }
    >;

    type CallMethodOptions = LibTypes.VarDefine<
        LibTypes.VarOmit<FetchTypes.RequestOptions, 'reqData'> & {
            readonly token?: string,
            readonly retry?: number,
        }
    >;

    type ProtocolStruct<T extends LibTypes.Exact<BaseProtocolStruct, T>> = T;

    type BaseProtocolStruct<
        TReqData extends ReqData = ReqData,
        TResData extends ResData = ResData,
    > = LibTypes.Define<{
        req: TReqData,
        res: TResData,
    }>;

    type ProtocolCallMethod = LibTypes.LooseArgumentsFunc<
        Promise<ResData>,
        [reqData?: ReqData, options?: CallMethodOptions]
    >;

    type BaseProtocol = LibTypes.FrozenGeneralObj<
        LibTypes.FrozenGeneralObj<BaseProtocolStruct>
    >;

    type InferProtocolCallMethodArgs<T extends ReqData> =
        LibTypes.Or<
            LibTypes.Not<LibTypes.IsExplicit<T>>,
            LibTypes.IsUnExist<T>
        > extends true
            ? [reqData?: null, options?: CallMethodOptions]
            : LibTypes.IsPartialObject<T> extends true
              ? [reqData?: T | null, options?: CallMethodOptions]
              : [reqData: T, options?: CallMethodOptions];

    // TODO no-literal-object
    type ProtocolCallMethodsFactory<
        TProtocol extends BaseProtocol,
        TRaw extends boolean,
    > = {
        readonly [a in keyof TProtocol]: {
            readonly [b in keyof TProtocol[a]]: (
                ...args: InferProtocolCallMethodArgs<TProtocol[a][b]['req']>
            ) => TRaw extends false
                ? Promise<TProtocol[a][b]['res']>
                : Promise<ResponseRaw<TProtocol[a][b]['res']>>;
        };
    };

    type ProtocolCallMethods = ProtocolCallMethodsFactory<Protocol, false>;

    type ResponseRawProtocolCallMethods = ProtocolCallMethodsFactory<
        Protocol,
        true
    >;

    namespace Protocol {
        type GetUploadCredentialsRes = LibTypes.VarDefine<{
            dir: string,
            host: string,
            policy: string,
            securityToken: string,
            signature: string,
            xOssCredentials: string,
            xOssDate: string,
            xOssSignatureVersion: string,
            callback: string,
            uploadId: string,
        }>;
    }
}
