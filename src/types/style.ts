import type { CSSProperties } from 'react';
import type { THEMES } from '$/consts';

export declare namespace StyleTypes {
    // web版：StyleSheet.NamedStyles → Record<string, CSSProperties>
    type Styles<T extends Record<string, CSSProperties> = Record<string, CSSProperties>> = T;
    type Style = CSSProperties;
    type StyleFields = keyof CSSProperties;

    type ThemeCreator = typeof THEMES.Default;
    type Theme = ReturnType<ThemeCreator>;

    type StylesCreator = LibTypes.LooseArgumentsFunc<
        Styles,
        [theme: Theme, options?: LibTypes.FrozenGeneralObj]
    >;

    type Layout = LibTypes.Simplify<Coordinate & Dimensions>;

    type Coordinate = LibTypes.FrozenDefine<{
        x: number;
        y: number;
    }>;

    type Dimensions = LibTypes.FrozenDefine<{
        width: number;
        height: number;
    }>;

    type ScaleDimensions = LibTypes.SetFieldType<
        LibTypes.FrozenDefine<
            Dimensions & {
                scale: number;
                coordinateScale: number;
            }
        >,
        'coordinateScale' | 'height' | 'scale' | 'width',
        number | undefined
    >;

    type PositionLayout = LibTypes.Simplify<
        Dimensions & LibTypes.FrozenPick<Rect, 'left' | 'top'>
    >;

    type VarRect = LibTypes.VarDefine<{
        left: number;
        top: number;
        right: number;
        bottom: number;
    }>;

    type Rect = LibTypes.FrozenDefine<VarRect>;

    type RectLayout = LibTypes.Simplify<Dimensions & Rect>;

    type SafeLayoutInsets = ReturnType<
        (typeof import('$/hooks'))['useSafeLayoutInsets']
    >;
}
