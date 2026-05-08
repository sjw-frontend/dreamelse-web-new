// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { WorldLineController } from '$/controllers';
import { useReactive, useZoneController } from '$/hooks';
import { optimize } from '$/view';

// ─── WorldLineCard ────────────────────────────────────────────────────────────

interface WorldLineCardProps {
    id: string;
    onPressItem?: (info: any) => void;
}

const CARD_ASPECT_W = 374;
const CARD_ASPECT_H = 256;
const BG_H_RATIO = 200 / 256;       // 背景图占内容区高度比
const ROLE_W_RATIO = 183 / 374;     // 角色图宽度比
const OPTIMAL_WH_RATIO = 1.5;       // 角色图高宽比 height = width * ratio

const WorldLineCard = optimize(({ id, onPressItem }: WorldLineCardProps) => {
    const worldLineCtrl = useZoneController(WorldLineController);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cardWidth, setCardWidth] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            setCardWidth(entries[0]?.contentRect.width ?? 0);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const data = useReactive(
        () => worldLineCtrl.getWorldLine(id),
        { deep: true },
        [id],
    );

    if (data == null) return <div ref={containerRef} style={{ width: 'calc(100% - 16px)', margin: '8px 8px 0 8px' }} />;

    const item = data.state;

    const contentHeight = cardWidth > 0 ? cardWidth / (CARD_ASPECT_W / CARD_ASPECT_H) : 0;
    const bgHeight = contentHeight * BG_H_RATIO;
    const roleWidth = cardWidth * ROLE_W_RATIO;
    const roleHeight = roleWidth * OPTIMAL_WH_RATIO;
    const textWidth = cardWidth * (200 / CARD_ASPECT_W);

    const dateStr = item.lastPlayTime == null ? '' : (() => {
        const d = new Date(item.lastPlayTime * 1000);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${mm}-${dd}`;
    })();

    const bgColor = item.backgroundColor ?? '#1A1A1A';
    const coverUri = item.cover?.uri ?? null;
    const coverRoles = item.coverRoles ?? [];
    const tags = (item.tags ?? []).slice(0, 2);
    const achievements = item.achievements ?? [];

    return (
        <div
            ref={containerRef}
            onClick={() => data && onPressItem?.(data)}
            style={{
                width: 'calc(100% - 16px)',
                margin: '8px 8px 0 8px',
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: '#1A1A1A',
                cursor: 'pointer',
            }}
        >
            {/* 背景图 + 角色图 + 文字叠加区 */}
            <div style={{ position: 'relative', width: '100%', height: bgHeight, overflow: 'visible' }}>
                {/* 背景图 */}
                {coverUri ? (
                    <img
                        src={coverUri}
                        alt=""
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none',
                        }}
                    />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: bgColor }} />
                )}

                {/* 渐变遮罩 */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(to bottom, ${bgColor}00 0%, ${bgColor}33 20%, ${bgColor}80 50%, ${bgColor}CC 80%, ${bgColor}CC 100%)`,
                        pointerEvents: 'none',
                    }}
                />

                {/* 角色图（从背景图底部溢出） */}
                {coverRoles.length === 1 && coverRoles[0]?.uri && (
                    <img
                        src={coverRoles[0].uri}
                        alt=""
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            width: roleWidth,
                            height: roleHeight,
                            objectFit: 'contain',
                            objectPosition: 'bottom',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                {coverRoles.length >= 2 && (
                    <>
                        {coverRoles[1]?.uri && (
                            <img
                                src={coverRoles[1].uri}
                                alt=""
                                style={{
                                    position: 'absolute',
                                    right: (33 / CARD_ASPECT_W) * cardWidth,
                                    bottom: 0,
                                    width: roleWidth,
                                    height: roleHeight,
                                    objectFit: 'contain',
                                    objectPosition: 'bottom',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                }}
                            />
                        )}
                        {coverRoles[0]?.uri && (
                            <img
                                src={coverRoles[0].uri}
                                alt=""
                                style={{
                                    position: 'absolute',
                                    right: -(30 / CARD_ASPECT_W) * cardWidth,
                                    bottom: 0,
                                    width: roleWidth,
                                    height: roleHeight,
                                    objectFit: 'contain',
                                    objectPosition: 'bottom',
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                }}
                            />
                        )}
                    </>
                )}

                {/* 文字叠加：日期在左上，标题+标签+幕数在左下 */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        pointerEvents: 'none',
                    }}
                >
                    {/* 日期 */}
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#EDEDED', opacity: 0.6, lineHeight: '16px' }}>
                        {dateStr}
                    </span>

                    {/* 标题 + 标签行 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {item.title ? (
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: '#EDEDED',
                                    lineHeight: '26px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    maxWidth: textWidth,
                                    textShadow: '0 2px 6px rgba(255,255,255,0.1)',
                                }}
                            >
                                {item.title}
                            </p>
                        ) : null}

                        {/* 标签 + 幕数 */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                                {tags.map(tag => (
                                    <span
                                        key={tag.id}
                                        style={{
                                            height: 23,
                                            padding: '2px 6px',
                                            borderRadius: 8,
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#EDEDED',
                                            lineHeight: '19px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {tag.label}
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#EDEDED" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#EDEDED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span style={{ fontSize: 14, fontWeight: 500, color: '#EDEDED', lineHeight: '19px', marginLeft: 2 }}>
                                    {item.actCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 成就区域 */}
            <div
                style={{
                    height: 56,
                    backgroundColor: '#1A1A1A',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                {achievements.length > 0 ? (
                    achievements.map(achievement => (
                        <span
                            key={achievement.id}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                padding: '0 12px',
                                height: 32,
                                borderRadius: 20,
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#EDEDED',
                                display: 'flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {achievement.title}
                        </span>
                    ))
                ) : (
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#EDEDED', opacity: 0.2 }}>
                        暂未达成就
                    </span>
                )}
            </div>
        </div>
    );
});

// ─── WorldLineList ────────────────────────────────────────────────────────────

interface WorldLineListProps {
    ids?: string[];
    onPressItem?: (info: any) => void;
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
        const observer = new IntersectionObserver(
            entries => { if (entries[0]?.isIntersecting) onEndReached(); },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [onEndReached]);

    if (ids.length === 0) {
        return (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M8 8C8 5.79 9.79 4 12 4H40C40.55 4 41 4.45 41 5V38C41 38.55 40.55 39 40 39H12C11.45 39 11 39.45 11 40C11 40.55 11.45 41 12 41H41V44H12C9.79 44 8 42.21 8 40V8Z" fill="#EDEDED" fillOpacity="0.2"/>
                </svg>
                <span style={{ fontSize: 14, color: '#EDEDED', opacity: 0.4 }}>暂无内容</span>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', overflowY: 'auto', paddingBottom: 8 }}>
            {ids.map(id => (
                <WorldLineCard key={id} id={id} onPressItem={onPressItem} />
            ))}
            <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
    );
});
