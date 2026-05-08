// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PopupTypes } from '$/types';
import { optimize } from '$/view/optimize';

interface Props { info: PopupTypes.ImageViewerInfo | null; onClose: () => void }

export const ImageViewer = optimize(({ info, onClose }: Props) => {
    const images: string[] = info
        ? (typeof info.source === 'string' ? [info.source] : [info.source?.uri ?? ''])
        : [];
    const [index, setIndex] = useState(0);
    const [scale, setScale] = useState(1);

    useEffect(() => { setIndex(0); setScale(1); }, [info]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setScale(s => Math.max(0.5, Math.min(4, s - e.deltaY * 0.001)));
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
        if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length - 1, i + 1));
    }, [images.length, onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <AnimatePresence>
            {info && (
                <motion.div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        backgroundColor: 'rgba(0,0,0,0.92)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    onWheel={handleWheel}
                >
                    <img
                        src={images[index]}
                        alt=""
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw', maxHeight: '90vh',
                            objectFit: 'contain',
                            transform: `scale(${scale})`,
                            transition: 'transform 0.1s',
                            borderRadius: 8,
                        }}
                    />
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setIndex(i => Math.max(0, i - 1)); }}
                                style={{
                                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
                                    color: '#fff', fontSize: 20, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                disabled={index === 0}
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setIndex(i => Math.min(images.length - 1, i + 1)); }}
                                style={{
                                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
                                    color: '#fff', fontSize: 20, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                disabled={index === images.length - 1}
                            >
                                ›
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 16, right: 16,
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
                            color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        aria-label="关闭"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="1" y1="1" x2="11" y2="11" />
                            <line x1="11" y1="1" x2="1" y2="11" />
                        </svg>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
