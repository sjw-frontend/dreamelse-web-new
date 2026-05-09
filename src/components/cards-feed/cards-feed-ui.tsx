// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { CardsFeedController } from './cards-feed-controller';

// ─── FeedDramatizeCardItem ────────────────────────────────────────────────────

const FeedDramatizeCardItem = optimize(({ id, ctrl }: { id: string; ctrl: any }) => {
    const data = ctrl.getRecord(id);
    if (!data) return null;

    return (
        <div style={{
            width: '100%', height: '100%',
            position: 'relative', overflow: 'hidden',
            backgroundColor: '#0B1426',
        }}>
            {data.coverImage && (
                <img
                    src={data.coverImage}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85))',
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '24px 20px',
            }}>
                <p style={{ color: '#EDEDED', fontSize: 20, fontWeight: 700, margin: '0 0 8px 0' }}>
                    {data.title}
                </p>
                <button
                    type="button"
                    onClick={() => ctrl.startDramatize(id)}
                    style={{
                        height: 44, padding: '0 24px', borderRadius: 22,
                        backgroundColor: 'var(--color-accent, #ABFF1A)',
                        color: '#0B1426', fontWeight: 600, fontSize: 15,
                        border: 'none', cursor: 'pointer',
                    }}
                >
                    开始演绎
                </button>
            </div>
        </div>
    );
});

// ─── CardsFeed ────────────────────────────────────────────────────────────────

interface CardsFeedProps {
    itemHeight?: number;
    onEndReached?: () => void;
    onBeforeCurrentItemChange?: (index: number) => void;
}

export const CardsFeed = optimize(({
    itemHeight,
    onEndReached,
    onBeforeCurrentItemChange,
}: CardsFeedProps) => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CardsFeedController);

    const reactiveState = useReactive(() => ({
        ids: ctrl.state.ids,
    }));

    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const height = itemHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 800);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !onEndReached) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0]?.isIntersecting) onEndReached();
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [onEndReached]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
                    const index = Number((entry.target as HTMLElement).dataset.index);
                    onBeforeCurrentItemChange?.(index);
                    ctrl.setCurrentIndex?.(index);
                }
            });
        }, { threshold: 0.8 });

        const items = container.querySelectorAll('[data-feed-item]');
        items.forEach(item => observer.observe(item));
        return () => observer.disconnect();
    }, [reactiveState.ids, onBeforeCurrentItemChange]);

    return (
        <div
            ref={containerRef}
            style={{
                height: '100%',
                overflowY: 'scroll',
                scrollSnapType: 'y mandatory',
            }}
        >
            {reactiveState.ids.map((id: string, index: number) => (
                <div
                    key={id}
                    data-feed-item
                    data-index={index}
                    style={{
                        height,
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                    }}
                >
                    <RenderParentProvider>
                        <FeedDramatizeCardItem id={id} ctrl={ctrl} />
                    </RenderParentProvider>
                </div>
            ))}
            <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
    );
});
