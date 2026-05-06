import type { ReactElement } from 'react';

export declare namespace I18nTypes {
    type InferArgs<T extends LibTypes.FrozenGeneralObj> =
        LibTypes.IsExplicitObject<T> extends true ? [values: T] : [];

    type InferTranslateRecord<T extends TextRecord> = {
        [p in keyof T]: (
            ...args: InferArgs<LibTypes.InferStringTemplateValues<T[p]>>
        ) => T[p];
    };

    type InferRichArgs<
        A1 extends LibTypes.FrozenGeneralObj,
        A2 extends LibTypes.FrozenGeneralObj,
    > =
        LibTypes.IsExplicitObject<A1> extends true
            ? LibTypes.IsExplicitObject<A2> extends true
                ? [LibTypes.FrozenDefine<{ values: A1, elements: A2 }>]
                : [LibTypes.FrozenDefine<{ values: A1 }>]
            : LibTypes.IsExplicitObject<A2> extends true
              ? [LibTypes.FrozenDefine<{ elements: A2 }>]
              : [];

    type InferTranslateRichRecord<T extends TextRecord> = {
        [p in keyof T]: (
            ...args: InferRichArgs<
                LibTypes.InferStringTemplateValues<T[p]>,
                LibTypes.InferStringTemplateTag<T[p], ReactElement>
            >
        ) => T[p];
    };

    type TextRecord = LibTypes.FrozenGeneralObj<string>;

    type TranslateValues = LibTypes.FrozenGeneralObj<number | string>;

    type TranslateElements = LibTypes.FrozenGeneralObj<ReactElement>;

    // TODO 跟InferRichArgs 绑定键
    type TranslateRichArg = LibTypes.FrozenDefine<{
        values?: TranslateValues,
        elements?: TranslateElements,
    }>;
}
