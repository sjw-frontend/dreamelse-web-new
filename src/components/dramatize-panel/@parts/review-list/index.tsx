// @ts-nocheck
import { useEffect, useRef } from 'react';
import { useReactive } from '$/hooks';
import { optimize } from '$/view';
import type { DramatizePanelController, ReviewInfo } from '../../dramatize-panel-controller';
import { DialogItem } from './@parts/dialog-item';
import { NarrationItem } from './@parts/narration-item';
import { ChapterItem } from './@parts/chapter-item';

interface ReviewListProps {
    ctrl: DramatizePanelController;
    show: boolean;
    onClose: () => void;
}

export const ReviewList = optimize(({ ctrl, show, onClose }: ReviewListProps) => {
    const sentinelRef = useRef<HTMLDivElement>(null);

    const reactiveState = useReactive(() => ({
        reviewIds: ctrl.state.reviewIds,
    }));

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0]?.isIntersecting) ctrl.requestMoreReview();
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [ctrl]);

    return (
        <div style={{
            position: 'absolute', inset: 0,
            zIndex: 9998,
            display: show ? 'flex' : 'none',
            flexDirection: 'column',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            backgroundColor: 'rgba(0,0,0,0.6)',
        }}>
            {/* 顶部 header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 56, flexShrink: 0, position: 'relative',
                borderBottom: '0.5px solid rgba(255,255,255,0.1)',
            }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        position: 'absolute', left: 16,
                        background: 'none', border: 'none',
                        color: '#EDEDED', cursor: 'pointer', padding: 8,
                    }}
                    aria-label="关闭"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="3" x2="17" y2="17" />
                        <line x1="17" y1="3" x2="3" y2="17" />
                    </svg>
                </button>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#EDEDED' }}>回顾</span>
            </div>

            {/* 消息列表（column-reverse，最新在底部） */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column-reverse',
            }}>
                {/* 顶部哨兵：触发加载更多历史 */}
                <div ref={sentinelRef} style={{ height: 1 }} />
                {[...reactiveState.reviewIds].reverse().map((id: string) => {
                    const item = ctrl.getReview(id);
                    if (!item) return null;

                    if (item.chapterName !== null) {
                        return (
                            <ChapterItem
                                key={id}
                                chapterName={item.chapterName}
                                time={item.time}
                            />
                        );
                    }
                    if (item.roleName !== null) {
                        return (
                            <DialogItem
                                key={id}
                                roleName={item.roleName}
                                text={item.text}
                                isMe={item.isMe}
                                choice={item.choice}
                            />
                        );
                    }
                    return (
                        <NarrationItem
                            key={id}
                            text={item.text}
                            choice={item.choice}
                        />
                    );
                })}
            </div>
        </div>
    );
});
