// web版：用 visualViewport API 替代 RN Keyboard
import { useEffect, useMemo, useState } from 'react';

export const useKeyboard = () => {
    const [height, setHeight] = useState(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handler = () => {
            const h = window.innerHeight - (window.visualViewport?.height ?? window.innerHeight);
            const visible = h > 0;
            setHeight(Math.max(0, h));
            setShow(visible);
        };
        window.visualViewport?.addEventListener('resize', handler);
        return () => window.visualViewport?.removeEventListener('resize', handler);
    }, []);

    return useMemo(
        () => ({
            hide: () => (document.activeElement as HTMLElement)?.blur(),
            height,
            show,
        }),
        [height, show],
    );
};
