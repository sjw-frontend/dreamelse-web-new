import type { FrozenGeneralObj, GeneralObj } from './@base/general';
import type { Fest } from './@com';
import type { NonEmptyString } from './non-empty-string';

type GetLeftStringBeforeRightBracket<
    S extends string,
    TRightBracket extends string,
> = S extends `${infer P}${TRightBracket}${infer R}` ? [P, R] : never;

type GetRightStringAfterLeftBracket<
    S extends string,
    TLeftBracket extends string,
> = S extends `${string}${TLeftBracket}${infer P}` ? P : never;

type GetStringInBracket<
    S extends string,
    TLeftBracket extends string,
    TRightBracket extends string,
> = GetLeftStringBeforeRightBracket<
    GetRightStringAfterLeftBracket<S, TLeftBracket>,
    TRightBracket
>;

type GetStringInBracketRecursion<
    T extends string | [string, string],
    TLeftBracket extends string,
    TRightBracket extends string,
> = T extends readonly [infer K, infer R]
    ? K extends string
        ? R extends string
            ? | GetStringInBracketRecursion<
                        GetStringInBracket<R, TLeftBracket, TRightBracket>,
                        TLeftBracket,
                        TRightBracket
                    >
                  | NonEmptyString<Fest.Trim<K>>
            : never
        : never
    : T extends string
      ? GetStringInBracketRecursion<
            GetStringInBracket<T, TLeftBracket, TRightBracket>,
            TLeftBracket,
            TRightBracket
        >
      : never;

export type InferStringTemplateValues<
    TTemplate extends string,
    TLeftBracket extends string = '{{',
    TRightBracket extends string = '}}',
> = Fest.Simplify<
    FrozenGeneralObj<
        number | string,
        GetStringInBracketRecursion<TTemplate, TLeftBracket, TRightBracket>
    >
>;

type ExtractValidPlaceholders<T extends string> =
    T extends `${infer _Before}<${infer Key}>${infer After}`
        ? Key extends `/${infer _Rest}`
            ? ExtractValidPlaceholders<After>
            : ExtractValidPlaceholders<After> | Key
        : never;

type UniqueUnion<T> = T extends infer U ? (U extends T ? U : never) : never;

// TODO 处理不合法tag
export type InferStringTemplateTag<
    TTemplate extends string,
    TValue,
> = GeneralObj<TValue, UniqueUnion<ExtractValidPlaceholders<TTemplate>>>;
