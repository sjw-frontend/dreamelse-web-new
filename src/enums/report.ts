// import type { ApiTypes } from '$/types';

export enum Kind {
    Minor = 1, // 普通业务上报
    Major = 2, // 重要业务上报
    Frame = 3, // 框架统一上报
    Error = 4, // 异常上报
    FatalError = 5, // 致命异常上报
}
// declare type VerifyKind = LibTypes.VerifyLooseEqual<
//     Kind,
//     ApiTypes.Protocol.ReportContent['reportType']
// >;
