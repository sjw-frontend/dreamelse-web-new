import type { DeviceEnums, ReportEnums } from '$/enums';

import type { UserTypes } from './user';

export declare namespace ReportTypes {
    type ReportInfo = LibTypes.RequiredKeepUndefined<
        LibTypes.VarDefine<{
            business: string, // 业务名
            reportType: ReportEnums.Kind, // 不同type记录到不同的LogStore

            // 以下字段记录到日志中，并当monitor=true按以下字段维度进行统计 // TODO 待后端支持
            // monitor?: boolean, // 为true则上报到promethus
            appVersion: string,
            buildCode: string,
            buildId: string,
            device: DeviceEnums.Kind, // 设备
            deviceModel: string, // 设备型号
            platform: DeviceEnums.PlatformKind, // 平台
            platformId: string, // 平台id
            os: DeviceEnums.OSKind, // 系统
            osVersion: string, // 系统版本
            key: string, // 埋点key
            statValue?: number, // 耗时等需统计的数据
            subkey?: string, // 子key(需要细化场景时用)
            status?: string, // 状态码(进一步细化场景时用)

            // 以下字段仅记录到日志中
            timestamp?: number, // 时间戳
            userId?: UserTypes.UserId,
            userUniqueId?: string,
            uuid?: string,
            env?: LibTypes.FrozenGeneralObj,
            details?: LibTypes.FrozenGeneralObj, // 一个json
            /* 时区、地理位置等信息以后看看在哪个环节报 */
        }>
    >;

    type CommonReportInfo = LibTypes.FrozenPick<
        ReportInfo,
        Exclude<keyof ReportInfo, CustomFields>
    >;

    type CustomFields = 'details' | 'key' | 'status' | 'statValue' | 'subkey';

    type CustomReportInfo = LibTypes.PartialOnUndefined<
        LibTypes.VarPick<ReportInfo, CustomFields>
    >;
}
