import { BaseModel } from '$/core';
import { AppError } from '$/errors';
import type { CoreTypes } from '$/types';

export const useReport = <T extends CoreTypes.ReportClass>(
    ctrl: CoreTypes.Controller,
    Report: T,
) => {
    const report = ctrl[BaseModel.ReportInstanceSymbol];

    if (report?.constructor === Report) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return report as InstanceType<T>;
    }

    throw new AppError('引用了非法的Report');
};
