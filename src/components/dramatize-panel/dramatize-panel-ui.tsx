// @ts-nocheck
import { useCallback, useEffect, useRef } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { VerticalText } from '$/uis';
import { Image } from '$/uis/primitives';
import { DramatizePanelController, type ChapterListItem } from './dramatize-panel-controller';
import { ReviewList } from './@parts/review-list';

type Props = {
    display?: boolean;
    playId: string | null;
    speedEnabled?: boolean;
    speed?: number;
    chapterEnabled?: boolean;
    reviewEnabled?: boolean;
    showChapterList?: boolean;
    totalChapterCount?: number;
    selectedChapterId?: string | null;
    onShowReview?: (show: boolean) => string | null;
    onToggleListShow?: () => void;
    onChangeSpeed?: () => void;
    onSelectChapter?: (id: string) => void;
    onChapterListChange?: (list: ChapterListItem[]) => void;
    onRestart?: () => Promise<void>;
    onLayout?: (rect: DOMRect) => void;
    style?: React.CSSProperties;
};

const speedLabels: Record<number, string> = {
    0.5: '0.5x', 1: '1x', 1.5: '1.5x', 2: '2x',
};

export const DramatizePanel = optimize((props: Props) => {
    const {
        display = true,
        playId,
        speedEnabled = false,
        speed = 1,
        chapterEnabled = false,
        reviewEnabled = false,
        showChapterList = false,
        totalChapterCount = 0,
        selectedChapterId,
        onShowReview,
        onToggleListShow,
        onChangeSpeed,
        onSelectChapter,
        onChapterListChange,
        onRestart,
        style,
    } = props;

    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        DramatizePanelController,
        { playId, speedEnabled, chapterEnabled, reviewEnabled },
    );

    const reactiveState = useReactive(() => ({
        showReview: ctrl.state.showReview,
        chapterList: ctrl.state.chapterList,
        reviewIds: ctrl.state.reviewIds,
    }));

    // 同步外部 totalChapterCount
    useEffect(() => {
        ctrl.updateChaterCount(totalChapterCount ?? 0);
    }, [totalChapterCount]);

    // 同步 chapterList 给外部
    useEffect(() => {
        onChapterListChange?.(reactiveState.chapterList);
    }, [reactiveState.chapterList]);

    const handleShowReview = useCallback(() => {
        const narrativeId = onShowReview?.(true) ?? null;
        ctrl.setReviewStartNarrativeId(narrativeId);
        ctrl.showReview();
    }, [ctrl, onShowReview]);

    const handleHideReview = useCallback(() => {
        ctrl.hideReview();
        onShowReview?.(false);
    }, [ctrl, onShowReview]);

    const handleRestart = useCallback(async () => {
        await onRestart?.();
    }, [onRestart]);

    if (!display) return null;

    const blurStyle: React.CSSProperties = {
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        backgroundColor: 'rgba(255,255,255,0.15)',
        border: 'none',
        cursor: 'pointer',
    };

    return (
        <RenderParentProvider>
            {/* 回顾列表（全屏覆盖） */}
            <ReviewList
                ctrl={ctrl}
                show={reactiveState.showReview}
                onClose={handleHideReview}
            />

            {/* 面板主体 */}
            <div style={{
                position: 'absolute', left: 12, right: 12, bottom: 0,
                zIndex: 100,
                ...style,
            }}>
                {/* 按钮行 */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end',
                    height: 50, alignItems: 'center', gap: 8,
                    position: 'relative',
                }}>
                    {/* 速度按钮（左侧绝对定位） */}
                    {speedEnabled && (
                        <button
                            type="button"
                            onClick={onChangeSpeed}
                            style={{
                                position: 'absolute', left: 0,
                                height: 48, padding: '0 14px', borderRadius: 24,
                                display: 'flex', alignItems: 'center', gap: 4,
                                color: '#EDEDED', fontSize: 16, fontWeight: 600,
                                ...blurStyle,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                            {speedLabels[speed] ?? `${speed}x`}
                        </button>
                    )}

                    {/* 回顾按钮 */}
                    {reviewEnabled && (
                        <button
                            type="button"
                            onClick={handleShowReview}
                            style={{
                                width: 48, height: 48, borderRadius: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                ...blurStyle,
                            }}
                            aria-label="回顾"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EDEDED" strokeWidth="2" strokeLinecap="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M12 7v5l4 2" />
                            </svg>
                        </button>
                    )}

                    {/* 章节按钮 */}
                    {totalChapterCount > 0 && chapterEnabled && (
                        <button
                            type="button"
                            onClick={onToggleListShow}
                            style={{
                                height: 48, padding: '0 14px', borderRadius: 24,
                                display: 'flex', alignItems: 'center', gap: 4,
                                color: '#EDEDED', fontSize: 16, fontWeight: 600,
                                ...blurStyle,
                                backgroundColor: showChapterList
                                    ? 'var(--color-bg-card)'
                                    : 'rgba(255,255,255,0.15)',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            {totalChapterCount}
                        </button>
                    )}
                </div>

                {/* 章节列表行 */}
                {showChapterList && (
                    <div style={{ width: '100%', marginTop: 16, height: 180, position: 'relative' }}>
                        {/* 重新开始按钮 */}
                        <button
                            type="button"
                            onClick={handleRestart}
                            style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10,
                                ...blurStyle,
                                borderRadius: 12, padding: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            aria-label="重新开始"
                        >
                            <VerticalText
                                text="重新开始"
                                textStyle={{ fontSize: 14, color: '#EDEDED', fontWeight: 600 }}
                            />
                        </button>

                        {/* 章节卡片横向滚动 */}
                        <div style={{
                            overflowX: 'auto', height: '100%',
                            paddingLeft: 58, display: 'flex', gap: 8,
                            scrollbarWidth: 'none',
                        }}>
                            {reactiveState.chapterList.map((item: ChapterListItem) => (
                                <ChapterCard
                                    key={item.id}
                                    item={item}
                                    isSelected={item.id === selectedChapterId}
                                    onPress={() => onSelectChapter?.(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </RenderParentProvider>
    );
});

// ─── ChapterCard ──────────────────────────────────────────────────────────────

interface ChapterCardProps {
    item: ChapterListItem;
    isSelected: boolean;
    onPress: () => void;
}

const ChapterCard = optimize(({ item, isSelected, onPress }: ChapterCardProps) => (
    <button
        type="button"
        onClick={onPress}
        style={{
            width: 84, height: 180, flexShrink: 0,
            borderRadius: 12, overflow: 'hidden',
            border: isSelected ? '2px solid #EDEDED' : '2px solid transparent',
            position: 'relative', cursor: 'pointer',
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 0,
        }}
    >
        {item.image?.uri && (
            <img
                src={item.image.uri}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
        )}
        <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))',
        }} />
        <div style={{
            position: 'absolute', top: 12, left: 12, right: 12,
            writingMode: 'vertical-rl', textOrientation: 'mixed',
        }}>
            <span style={{ fontSize: 13, color: '#EDEDED', fontWeight: 600 }}>{item.title}</span>
        </div>
        {isSelected && (
            <div style={{
                position: 'absolute', top: 12, right: 12,
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: '#EDEDED',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#0B1426" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="2 6 5 9 10 3" />
                </svg>
            </div>
        )}
    </button>
));
