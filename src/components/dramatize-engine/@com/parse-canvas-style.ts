import { DRAMATIZE, VISUAL } from '$/consts';
import type { DramatizeTypes, WorldLineTypes } from '$/types';
import { DeviceUtils } from '$/utils';

import { DefaultDimensionsScale } from './consts';

export const canvasHeight = DeviceUtils.getWindowDimensions().height;
export const canvasWidth = canvasHeight * DRAMATIZE.ScreenWHRatio;

export const getCanvasX = <X extends LibTypes.Nullable<number>>(x: X) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (x == null
        ? null
        : (x * canvasWidth) / VISUAL.StandardWidth) as LibTypes.NullableIfAllow<
        X,
        null
    >;

export const getCanvasY = <Y extends LibTypes.Nullable<number>>(y: Y) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (y == null
        ? null
        : (y * canvasHeight) /
          VISUAL.StandardHeight) as LibTypes.NullableIfAllow<Y, null>;

export const getCanvasStyleFromMotion = <
    T extends WorldLineTypes.Api.MotionStyle,
>(
    motionStyle: T,
    dimensionsScale: LibTypes.Nullable<number>,
) => {
    type Style = DramatizeTypes.DirectorAnimationStyle &
        DramatizeTypes.DirectorSceneAnimatedStyle;

    const inputStyle = motionStyle as Style;

    const style: Style = {};

    style.scale = inputStyle.scale;
    style.rotation = inputStyle.rotation;
    style.opacity = inputStyle.opacity;
    style.brightness = inputStyle.brightness;
    style.blur = inputStyle.blur;
    style.color = inputStyle.color;

    const layoutX =
        inputStyle.x == null ? undefined : getCanvasX(inputStyle.x / 2);
    const layoutY =
        inputStyle.y == null ? undefined : getCanvasY(inputStyle.y / 2);

    style.x =
        layoutX == null
            ? undefined
            : layoutX * (dimensionsScale ?? DefaultDimensionsScale);
    style.y =
        layoutY == null
            ? undefined
            : layoutY * (dimensionsScale ?? DefaultDimensionsScale);

    // No Scene
    style.z = inputStyle.z;

    // Animated
    style.relativeScale = inputStyle.relativeScale;

    // Scene
    style.sharpness = inputStyle.sharpness;
    style.overlayColor = inputStyle.overlayColor;
    style.overlayOpacity = inputStyle.overlayOpacity;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return style as T;
};
