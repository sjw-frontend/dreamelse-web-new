// @ts-nocheck
import { useEffect, useRef } from 'react';
import { useInjectRenderController, useRenderState } from '$/hooks';
import { optimize } from '$/view';
import { Image } from '$/uis/primitives';
import type { ChapterListItem } from './dramatize-panel-controller';

// ─── WorldLineCard ────────────────────────────────────────────────────────────

interface WorldLineCardProps {
    id: string;
    onPress?: (id: string) => void;
}

const WorldLineCard = optimize(({ id, onPress }: WorldLineCardProps) => {
    // 从 DataStore 获取数据，这里用 id 作为 key 展示占位
    return (
        <div
            onClick={() => onPress?.(id)}
            style={{
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: 'var(--color-bg-card)',
                cursor: 'pointer',
                marginBottom: 12,
                position: 'relative',
                minHeight: 120,
            }}
        >
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '12px 16px',
            }}>
                <p style={{ color: '#EDEDED', fontSize: 14, fontWeight: 600, margin: 0 }}>{id}</p>
            </div>
        </div>
    );
});

// ─── WorldLineList ────────────────────────────────────────────────────────────

interface WorldLineListProps {
    ids?: string[];
    onPressItem?: (id: string) => void;
    onEndReached?: () => void;
    onRefresh?: () => void;
}

export const WorldLineList = optimize(({
    ids = [],
    onPressItem,
    onEndReached,
}: WorldLineListProps) => {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !onEndReached) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0]?.isIntersecting) onEndReached();
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [onEndReached]);

    return (
        <div style={{ width: '100%', overflowY: 'auto' }}>
            {ids.map(id => (
                <WorldLineCard key={id} id={id} onPress={onPressItem} />
            ))}
            <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
    );
});
