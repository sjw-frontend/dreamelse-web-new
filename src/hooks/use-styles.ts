import { type DependencyList, useContext, useMemo } from 'react';

import type { StyleTypes } from '$/types';

import { OverrideStylesHookContext, ThemeContext } from '../view/contexts';

type Deps = [deps?: DependencyList];
type Options<T = LibTypes.FrozenGeneralObj> = [
    options: T | (() => T),
    deps?: DependencyList,
];
type OptionalOptions<T = LibTypes.FrozenGeneralObj> = Deps | Options<T>;

type GetArgs<T> = T extends undefined
    ? Deps
    : LibTypes.IsExplicit<T> extends true
      ? LibTypes.IsPartialObject<T> extends true
          ? OptionalOptions<T>
          : Options<T>
      : Deps;

/** 当options开销大的时候，可以传函数 */
export const useStyles = <S extends StyleTypes.StylesCreator>(
    stylesCreator: S,
    ...args: GetArgs<Parameters<S>[1]>
) => {
    const [arg1, arg2] = args as OptionalOptions;
    const options = arg1 instanceof Array ? undefined : arg1;
    const deps =
        arg2 instanceof Array ? arg2 : arg1 instanceof Array ? arg1 : [];

    const themeCreator = useContext(ThemeContext);

    const styles = useMemo(() => {
        const theme = themeCreator();
        const res = stylesCreator(
            theme,
            (typeof options === 'function' ? options() : options) ?? {},
        );

        return res;
    }, deps);

    const useOverrideStyles = useContext(OverrideStylesHookContext);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return useOverrideStyles(styles, stylesCreator) as ReturnType<S>;
};
