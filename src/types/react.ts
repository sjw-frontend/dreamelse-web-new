import type { FC as _FC, PropsWithChildren as _PropsWithChildren } from 'react';

type DefaultProps = LibTypes.Exist;

export declare namespace ReactTypes {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type FCForExtends<P extends LibTypes.FrozenGeneralObj = any> = _FC<P>;

    type InferProps<T extends FCForExtends> =
        T extends FCForExtends<infer P> ? P : never;

    /** 函数组件 */
    type FC<P extends LibTypes.FrozenGeneralObj = LibTypes.FrozenGeneralObj> = _FC<
        Props<P>
    >;
    /** 带children的函数组件 */
    type FCWC<P extends LibTypes.FrozenGeneralObj = DefaultProps> = FC<
        PropsWithChildren<P>
    >;

    type Props<T extends LibTypes.FrozenGeneralObj = LibTypes.FrozenGeneralObj> =
        LibTypes.Simplify<
            Readonly<LibTypes.InferGeneralObjDefaultTypeParamIgnoreNever<T>>
        >;
    type PropsWithChildren<T extends LibTypes.FrozenGeneralObj = DefaultProps> =
        Props<_PropsWithChildren<T>>;

    type SimpleNode = bigint | boolean | number | string | null | undefined;

    type TextNode = bigint | number | string;
}
