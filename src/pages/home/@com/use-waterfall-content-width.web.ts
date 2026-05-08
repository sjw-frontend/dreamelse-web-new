// web版：使用 ResizeObserver 响应容器宽度变化
import { useEffect, useState } from 'react';

export const useWaterfallContentWidth = (marginHorizontal = 8) => {
    const [width, setWidth] = useState(() => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 375;
        return Math.floor((w - marginHorizontal * 2 - 8) / 2);
    });

    useEffect(() => {
        const ro = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect.width ?? window.innerWidth;
            setWidth(Math.floor((w - marginHorizontal * 2 - 8) / 2));
        });
        ro.observe(document.documentElement);
        return () => ro.disconnect();
    }, [marginHorizontal]);

    return width;
};
