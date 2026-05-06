// web版：去掉 Platform/RN TextInput 依赖，直接操作 DOM
import { useCallback, useRef } from 'react';

type IMEBindResult = LibTypes.Define<{
    isComposingRef: { current: boolean };
    bindWebIMEHandlers: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
}>;

export function useWebIME(): IMEBindResult {
    const isComposingRef = useRef(false);
    const cleanupRef = useRef<(() => void) | null>(null);

    const bindWebIMEHandlers = useCallback(
        (el: HTMLInputElement | HTMLTextAreaElement | null) => {
            cleanupRef.current?.();
            cleanupRef.current = null;
            if (!el) return;

            const onCompositionStart = () => { isComposingRef.current = true; };
            const onCompositionEnd = () => {
                isComposingRef.current = false;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            };
            const onInput = (e: Event) => {
                if (isComposingRef.current) e.stopImmediatePropagation();
            };

            el.addEventListener('compositionstart', onCompositionStart);
            el.addEventListener('compositionend', onCompositionEnd);
            el.addEventListener('input', onInput, true);

            cleanupRef.current = () => {
                el.removeEventListener('compositionstart', onCompositionStart);
                el.removeEventListener('compositionend', onCompositionEnd);
                el.removeEventListener('input', onInput, true);
            };
        },
        [],
    );

    return { isComposingRef, bindWebIMEHandlers };
}
