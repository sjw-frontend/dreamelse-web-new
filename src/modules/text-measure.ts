// Web stub for text-measure — uses canvas measureText to calculate line counts

interface FlatHeightsOptions {
    texts: string[];
    width: number;
    fontFamily?: string;
    fontWeight?: string;
    fontSize?: number;
}

interface TextHeightResult {
    lines: number;
}

let canvas: HTMLCanvasElement | null = null;

const getCtx = (): CanvasRenderingContext2D | null => {
    if (typeof document === 'undefined') return null;
    if (!canvas) canvas = document.createElement('canvas');
    return canvas.getContext('2d');
};

const measureLines = (
    text: string,
    width: number,
    font: string,
): number => {
    const ctx = getCtx();
    if (!ctx || width <= 0) return 1;
    ctx.font = font;

    const words = text.split('');
    let line = '';
    let lines = 1;

    for (const char of words) {
        const testLine = line + char;
        if (ctx.measureText(testLine).width > width && line.length > 0) {
            lines++;
            line = char;
        } else {
            line = testLine;
        }
    }
    return lines;
};

export const flatHeights = async (
    options: FlatHeightsOptions,
): Promise<TextHeightResult[]> => {
    const {
        texts,
        width,
        fontFamily = 'Inter',
        fontWeight = '500',
        fontSize = 14,
    } = options;

    const font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    return texts.map(text => ({
        lines: measureLines(text ?? '', width, font),
    }));
};
