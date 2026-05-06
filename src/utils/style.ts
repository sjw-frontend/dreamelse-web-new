import type { StyleTypes } from '$/types';

/** 将 RGB 颜色的亮度乘以 factor，深色模式下传 0.65 */
export const scaleLightness = (
    r: number,
    g: number,
    b: number,
    factor: number,
): [number, number, number] => {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        else if (max === gn) h = ((bn - rn) / d + 2) / 6;
        else h = ((rn - gn) / d + 4) / 6;
    }

    const newL = Math.min(1, l * factor);

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    if (s === 0) {
        const v = Math.round(newL * 255);
        return [v, v, v];
    }

    const q2 = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
    const p2 = 2 * newL - q2;
    return [
        Math.round(hue2rgb(p2, q2, h + 1 / 3) * 255),
        Math.round(hue2rgb(p2, q2, h) * 255),
        Math.round(hue2rgb(p2, q2, h - 1 / 3) * 255),
    ];
};

export const getPositionStyleByLayout = (
    dimension: StyleTypes.Dimensions | number,
    coordinate: StyleTypes.Coordinate,
) => {
    const width = typeof dimension === 'number' ? dimension : dimension.width;
    const height = typeof dimension === 'number' ? dimension : dimension.height;
    return {
        width,
        height,
        left: coordinate.x - width / 2,
        top: coordinate.y - height / 2,
    };
};
