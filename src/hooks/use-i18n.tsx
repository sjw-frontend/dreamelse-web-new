// TODO 多语言支持完善
import i18next from 'i18next';
import { useMemo } from 'react';
import { Trans, initReactI18next, useTranslation } from 'react-i18next';

import type { I18nTypes } from '$/types';

i18next.use(initReactI18next).init({ lng: 'zh', nsSeparator: false });

export const useI18n = <T extends I18nTypes.TextRecord>(resource: T) => {
    const { t } = useTranslation();
    return useMemo(() => {
        // i18next.addResources('zh', 'translation', resource);

        const res: LibTypes.VarGeneralObj<LibTypes.Func> = {};
        Object.keys(resource).forEach(k => {
            const text = resource[k];
            if (text != null) {
                res[k] = (values: I18nTypes.TranslateValues) => t(text, values);
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return res as I18nTypes.InferTranslateRecord<T>;
    }, [resource]);
};

export const useI18nRich = <T extends I18nTypes.TextRecord>(resource: T) => {
    const { t } = useTranslation();
    return useMemo(() => {
        // i18next.addResources('zh', 'translation', resource);

        const res: LibTypes.VarGeneralObj<LibTypes.Func> = {};
        Object.keys(resource).forEach(k => {
            const text = resource[k];
            if (text != null) {
                res[k] = (arg?: I18nTypes.TranslateRichArg) =>
                    arg?.elements ? (
                        <Trans
                            i18nKey={text}
                            values={arg.values}
                            components={arg.elements}
                        />
                    ) : (
                        t(text, arg?.values)
                    );
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return res as I18nTypes.InferTranslateRichRecord<T>;
    }, [resource]);
};
