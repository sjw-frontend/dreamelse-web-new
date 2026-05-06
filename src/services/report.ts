// @ts-nocheck
import * as Sentry from '@sentry/react-native';

import { APP } from '$/consts';
import { BaseService, service } from '$/core';
import { ReportEnums } from '$/enums';
import type { ReportTypes } from '$/types';
import { JSONUtils } from '$/utils';

import { ApiService } from './api';
import { AppService } from './app/app-service';

@service()
export class ReportService extends BaseService {
    public constructor(apiService: ApiService, appService: AppService) {
        super();
        this.#apiService = apiService;
        this.#appService = appService;

        this.#init();
    }

    readonly #apiService;
    readonly #appService;

    #init() {
        this.setForeignSDKInfo();
        this.#appService.addEventListener('storeDataChange', () => {
            this.setForeignSDKInfo();
        });
    }

    #getDetails(info: ReportTypes.CustomReportInfo) {
        try {
            return info.details && JSONUtils.safeStringify(info.details);
        } catch {
            return undefined;
        }
    }

    async #report(
        kind: ReportEnums.Kind,
        info: ReportTypes.CustomReportInfo,
        monitor?: boolean,
    ) {
        const commonInfo = await this.getCommonInfo(kind, monitor);

        const jsonStr = JSONUtils.safeStringify({
            ...commonInfo,
            ...info,
            env: JSONUtils.safeStringify(commonInfo.env) ?? undefined,
            details: this.#getDetails(info) ?? undefined,
        });

        jsonStr != null &&
            (await this.#apiService.call.report.app_log({
                json_data: jsonStr,
            }));

        this.#captureToSentry(kind, info, commonInfo);
    }

    #captureToSentry(
        kind: ReportEnums.Kind,
        info: ReportTypes.CustomReportInfo,
        commonInfo: ReportTypes.CommonReportInfo,
    ) {
        if (
            kind !== ReportEnums.Kind.Error &&
            kind !== ReportEnums.Kind.FatalError
        ) {
            return;
        }

        Sentry.withScope(scope => {
            scope.setLevel(
                kind === ReportEnums.Kind.FatalError ? 'fatal' : 'error',
            );
            scope.setTags({
                app_env: APP.ENV.Name,
                app_version: commonInfo.appVersion,
                build_id: commonInfo.buildId,
                platform: commonInfo.platform,
                report_kind: String(kind),
            });

            if (info.status != null) {
                scope.setTag('status', info.status);
            }
            if (info.subkey != null) {
                scope.setTag('subkey', info.subkey);
            }
            if (info.statValue != null) {
                scope.setExtra('stat_value', info.statValue);
            }

            scope.setContext('report_info', {
                key: info.key,
                status: info.status ?? null,
                subkey: info.subkey ?? null,
                details: this.#getDetails(info) ?? null,
                userId: commonInfo.userId ?? null,
                userUniqueId: commonInfo.userUniqueId ?? null,
                uuid: commonInfo.uuid ?? null,
            });

            Sentry.captureMessage(info.key);
        });
    }

    public getCommonInfo = async (
        kind?: ReportEnums.Kind,
        _monitor?: boolean, // TODO
    ) => {
        const storeData = await this.#appService.getStoreData();
        return {
            ...this.#appService.AppInfo,
            business: APP.Name,
            // monitor,
            reportType: kind ?? ReportEnums.Kind.Minor,
            timestamp: Date.now(),
            userId: storeData.loggedIn?.userInfo.id,
            userUniqueId: storeData.loggedIn?.userInfo.uniqueId,
            uuid: storeData.uuid,
            env: APP.ENV,
        } satisfies ReportTypes.CommonReportInfo;
    };

    public readonly minor = (
        info: ReportTypes.CustomReportInfo,
        monitor?: boolean,
    ) => {
        this.#report(ReportEnums.Kind.Minor, info, monitor);
    };

    public readonly major = (
        info: ReportTypes.CustomReportInfo,
        monitor?: boolean,
    ) => {
        this.#report(ReportEnums.Kind.Major, info, monitor);
    };

    public readonly frame = (
        info: ReportTypes.CustomReportInfo,
        monitor?: boolean,
    ) => {
        this.#report(ReportEnums.Kind.Frame, info, monitor);
    };

    public readonly error = (
        info: ReportTypes.CustomReportInfo,
        monitor?: boolean,
    ) => {
        this.#report(ReportEnums.Kind.Error, info, monitor);
    };

    public readonly fatalError = (
        info: ReportTypes.CustomReportInfo,
        monitor?: boolean,
    ) => {
        this.#report(ReportEnums.Kind.FatalError, info, monitor);
    };

    public readonly setForeignSDKInfo = async () => {
        const storeData = await this.#appService.getStoreData();
        const info = {
            userId: storeData.loggedIn?.userInfo.id,
            userUniqueId: storeData.loggedIn?.userInfo.uniqueId,
        };
        Sentry.setUser({
            id: storeData.uuid,
            ...info,
        });
    };
}
