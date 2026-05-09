// @ts-nocheck
import { useEffect, useRef, useState } from 'react';

type Coordinate = { x: number; y: number };
type Area = { leftTop: Coordinate; rightBottom: Coordinate };

export type LockAreaImageProps = {
    image?: { uri: string; width: number; height: number } | null;
    area?: Area | null;
    rect?: { left?: number; right?: number; top?: number; bottom?: number } | null;
    style?: React.CSSProperties;
};

type ViewportConfig = {
    viewWidth: number;
    viewHeight: number;
    imageWidth: number;
    imageHeight: number;
    headRect: Area;
    paddingLeftPct?: number;
    paddingRightPct?: number;
    paddingTopPct?: number;
    paddingBottomPct?: number;
};

const calculateImageStyle = (config: ViewportConfig) => {
    const {
        viewWidth, viewHeight,
        imageWidth, imageHeight,
        headRect,
        paddingLeftPct: pL,
        paddingRightPct: pR,
        paddingTopPct: pT,
        paddingBottomPct: pB,
    } = config;

    const headW = headRect.rightBottom.x - headRect.leftTop.x;
    const headH = headRect.rightBottom.y - headRect.leftTop.y;

    if (headW <= 0 || headH <= 0) return null;

    let scale: number;

    if (pL !== undefined && pR !== undefined) {
        scale = (viewWidth * (1 - pL - pR)) / headW;
    } else if (pT !== undefined && pB !== undefined) {
        scale = (viewHeight * (1 - pT - pB)) / headH;
    } else if (pL !== undefined || pR !== undefined) {
        scale = (viewWidth * 0.4) / headW;
    } else if (pT !== undefined || pB !== undefined) {
        scale = (viewHeight * 0.4) / headH;
    } else {
        return null;
    }

    if (scale <= 0) return null;

    const scaledHeadW = headW * scale;
    const scaledHeadH = headH * scale;

    let finalLeft: number;
    let finalTop: number;

    if (pL !== undefined && pR !== undefined) {
        finalLeft = viewWidth * pL - headRect.leftTop.x * scale;
    } else if (pL !== undefined) {
        finalLeft = viewWidth * pL - headRect.leftTop.x * scale;
    } else if (pR !== undefined) {
        finalLeft = viewWidth * (1 - pR) - headRect.rightBottom.x * scale;
    } else {
        finalLeft = (viewWidth - scaledHeadW) / 2 - headRect.leftTop.x * scale;
    }

    if (pT !== undefined && pB !== undefined) {
        finalTop = viewHeight * pT - headRect.leftTop.y * scale;
    } else if (pT !== undefined) {
        finalTop = viewHeight * pT - headRect.leftTop.y * scale;
    } else if (pB !== undefined) {
        finalTop = viewHeight * (1 - pB) - headRect.rightBottom.y * scale;
    } else {
        finalTop = (viewHeight - scaledHeadH) / 2 - headRect.leftTop.y * scale;
    }

    return {
        width: imageWidth * scale,
        height: imageHeight * scale,
        left: finalLeft,
        top: finalTop,
    };
};

export const LockAreaImage = (props: LockAreaImageProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [observedSize, setObservedSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            // Only update if size is valid — ignore collapse caused by absolute-positioned child
            if (width > 0 && height > 0) {
                setObservedSize(prev => {
                    if (prev?.width === width && prev?.height === height) return prev;
                    return { width, height };
                });
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Use style-provided size immediately (no ResizeObserver delay needed for fixed-size containers)
    const styleW = typeof props.style?.width === 'number' ? props.style.width : null;
    const styleH = typeof props.style?.height === 'number' ? props.style.height : null;
    const viewW = observedSize?.width ?? styleW ?? 0;
    const viewH = observedSize?.height ?? styleH ?? 0;

    const canCalculate = props.image && props.area && props.rect && viewW > 0 && viewH > 0;

    let imageStyle: React.CSSProperties;

    if (canCalculate) {
        const calculated = calculateImageStyle({
            viewWidth: viewW,
            viewHeight: viewH,
            imageWidth: props.image.width,
            imageHeight: props.image.height,
            headRect: props.area,
            paddingLeftPct: props.rect.left,
            paddingRightPct: props.rect.right,
            paddingTopPct: props.rect.top,
            paddingBottomPct: props.rect.bottom,
        });

        if (calculated) {
            imageStyle = {
                position: 'absolute',
                width: calculated.width,
                height: calculated.height,
                left: calculated.left,
                top: calculated.top,
            };
        }
    }

    // fallback: no area/rect, calculation failed, or size not yet known
    if (!imageStyle && props.image) {
        imageStyle = {
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
        };
    }

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', overflow: 'hidden', ...props.style }}
        >
            {props.image && imageStyle && (
                <img
                    src={props.image.uri}
                    alt=""
                    style={{ maxWidth: 'none', ...imageStyle }}
                />
            )}
        </div>
    );
};
