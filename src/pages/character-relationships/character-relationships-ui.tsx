// @ts-nocheck
import { useReactive, useRegisterRenderController } from '$/hooks';
import { LockAreaImage } from '$/uis';
import { FileUtils } from '$/utils';
import { optimize } from '$/view';
import { Pressable } from '$/uis/primitives';
import { CharacterRelationshipsController } from './character-relationships-controller';
import { useMemo, useRef, useState } from 'react';

const RelationshipBubble = ({ relation, nodeDirection }) => (
    <div style={{
        position: 'absolute',
        ...(nodeDirection === 'left'
            ? { right: '-100%' }
            : nodeDirection === 'right'
            ? { left: '-100%' }
            : { top: -60, left: '50%', transform: 'translateX(-50%)' }),
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: '6px 10px',
        minWidth: 80,
        zIndex: 10,
    }}>
        <span style={{ fontSize: 12, color: '#EDEDED', fontWeight: 600 }}>{relation.title}</span>
        {relation.desc && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: 2 }}>
                {relation.desc}
            </span>
        )}
    </div>
);

export const CharacterRelationshipsPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterRelationshipsController);

    const state = useReactive(() => ({
        dataState: ctrl.state.data && { ...ctrl.state.data.state },
    }));

    const relationships = useMemo(
        () => [
            ...(state.dataState?.relationships ?? []),
            ...(state.dataState?.relation ? [state.dataState.relation] : []),
        ],
        [state.dataState?.relationships, state.dataState?.relation],
    );

    const characterName = state.dataState?.name ?? '';
    const characterAvatar = state.dataState?.currentFigure?.visual ?? null;

    const centralFaceInfo = useMemo(
        () => characterAvatar && FileUtils.getImageFaceInfo(characterAvatar, { top: 0.25, left: 0.25, right: 0.25 }),
        [characterAvatar],
    );

    // Pan/zoom state
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        dragRef.current = { startX: e.clientX, startY: e.clientY, startTx: transform.x, startTy: transform.y };
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current) return;
        setTransform(t => ({
            ...t,
            x: dragRef.current!.startTx + e.clientX - dragRef.current!.startX,
            y: dragRef.current!.startTy + e.clientY - dragRef.current!.startY,
        }));
    };
    const handleMouseUp = () => { dragRef.current = null; };
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setTransform(t => ({ ...t, scale: Math.min(3, Math.max(0.5, t.scale - e.deltaY * 0.001)) }));
    };
    const handleDoubleClick = () => setTransform({ x: 0, y: 0, scale: 1 });

    // Layout
    const W = 390;
    const H = 900;
    const cx = W / 2;
    const cy = H / 2;

    const sorted = useMemo(
        () => [...relationships].sort((a, b) => (b.weight ?? -Infinity) - (a.weight ?? -Infinity)),
        [relationships],
    );
    const core = sorted.slice(0, 8);
    const nonCore = sorted.slice(8);

    const CORE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
    const corePositions = core.map((rel, i) => {
        const angleDeg = CORE_ANGLES[i] ?? 0;
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        // Determine bubble direction based on which side of center the node is on
        const nodeDirection: 'left' | 'right' | 'center' =
            angleDeg > 180 && angleDeg < 360 ? 'left'
            : angleDeg > 0 && angleDeg < 180 ? 'right'
            : 'center';
        return {
            rel,
            nodeX: cx + 190 * Math.cos(rad),
            nodeY: cy + 190 * Math.sin(rad),
            labelX: cx + 140 * Math.cos(rad),
            labelY: cy + 140 * Math.sin(rad),
            nodeDirection,
        };
    });

    const nonCorePositions = nonCore.map((rel, i) => {
        const angleStep = 360 / Math.max(nonCore.length, 1);
        const offset = core.length > 0 ? 360 / (core.length * 2) : 0;
        const rad = (((offset + angleStep * i) - 90) * Math.PI) / 180;
        return {
            rel,
            nodeX: cx + 300 * Math.cos(rad),
            nodeY: cy + 300 * Math.sin(rad),
        };
    });

    if (relationships.length === 0) {
        return (
            <RenderParentProvider>
                <div className="flex flex-col h-full bg-bg-card">
                    <div className="flex flex-row items-center px-4 pt-4 pb-2 shrink-0">
                        <Pressable onPress={ctrl.goBack} className="w-9 h-9 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Pressable>
                        <span className="flex-1 text-center text-text-primary font-semibold text-lg">关系图谱</span>
                        <div className="w-9" />
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <span className="text-white/40 text-base">暂无关系数据</span>
                    </div>
                </div>
            </RenderParentProvider>
        );
    }

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card overflow-hidden">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 shrink-0 z-10 relative">
                    <Pressable onPress={ctrl.goBack} className="w-9 h-9 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Pressable>
                    <span className="flex-1 text-center text-text-primary font-semibold text-lg">关系图谱</span>
                    <div className="w-9" />
                </div>

                {/* Graph canvas */}
                <div
                    className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onDoubleClick={handleDoubleClick}
                >
                    <div
                        style={{
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                            transformOrigin: 'center center',
                            width: W,
                            height: H,
                            position: 'relative',
                            margin: '0 auto',
                        }}
                    >
                        {/* SVG lines */}
                        <svg
                            width={W}
                            height={H}
                            className="absolute inset-0 pointer-events-none"
                            style={{ zIndex: 1 }}
                        >
                            {corePositions.map((pos, i) => (
                                <g key={i}>
                                    <line
                                        x1={cx} y1={cy}
                                        x2={pos.labelX} y2={pos.labelY}
                                        stroke="rgba(255,255,255,0.08)"
                                        strokeWidth="1"
                                    />
                                    <line
                                        x1={pos.labelX} y1={pos.labelY}
                                        x2={pos.nodeX} y2={pos.nodeY}
                                        stroke="rgba(255,255,255,0.08)"
                                        strokeWidth="1"
                                    />
                                </g>
                            ))}
                            {nonCorePositions.map((pos, i) => (
                                <line
                                    key={i}
                                    x1={cx} y1={cy}
                                    x2={pos.nodeX} y2={pos.nodeY}
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="1"
                                />
                            ))}
                        </svg>

                        {/* Central node */}
                        <div
                            className="absolute flex flex-col items-center gap-1"
                            style={{ left: cx - 32, top: cy - 32, zIndex: 10 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-bg-card border-2 border-accent overflow-hidden">
                                {characterAvatar ? (
                                    <LockAreaImage
                                        image={characterAvatar}
                                        area={centralFaceInfo?.face}
                                        rect={centralFaceInfo?.rect}
                                        style={{ width: 64, height: 64, borderRadius: 32 }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/10">
                                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                            <circle cx="14" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <span className="text-text-primary text-xs font-semibold text-center max-w-20 truncate">{characterName}</span>
                        </div>

                        {/* Core relationship nodes */}
                        {corePositions.map((pos, i) => (
                            <div
                                key={i}
                                className="absolute flex flex-col items-center gap-1"
                                style={{ left: pos.nodeX - 24, top: pos.nodeY - 24, zIndex: 5, position: 'absolute' }}
                            >
                                {pos.rel.title && (
                                    <RelationshipBubble relation={pos.rel} nodeDirection={pos.nodeDirection} />
                                )}
                                <div className="w-12 h-12 rounded-full bg-bg-card border border-white/20 overflow-hidden flex items-center justify-center">
                                    {pos.rel.avatar?.uri ? (
                                        <img src={pos.rel.avatar.uri} alt={pos.rel.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-text-secondary text-lg">{pos.rel.name?.[0] ?? '?'}</span>
                                    )}
                                </div>
                                <span className="text-text-secondary text-xs text-center max-w-16 truncate">{pos.rel.name}</span>
                                {pos.rel.relation && (
                                    <span className="text-accent text-xs text-center max-w-16 truncate">{pos.rel.relation}</span>
                                )}
                            </div>
                        ))}

                        {/* Non-core relationship nodes */}
                        {nonCorePositions.map((pos, i) => (
                            <div
                                key={i}
                                className="absolute flex flex-col items-center gap-1"
                                style={{ left: pos.nodeX - 16, top: pos.nodeY - 16, zIndex: 4 }}
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                                    <span className="text-text-secondary text-xs">{pos.rel.name?.[0] ?? '?'}</span>
                                </div>
                                <span className="text-text-secondary/60 text-xs text-center max-w-12 truncate">{pos.rel.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hint */}
                <div className="flex items-center justify-center py-2 shrink-0">
                    <span className="text-text-secondary/40 text-xs">双击重置 · 滚轮缩放 · 拖拽移动</span>
                </div>
            </div>
        </RenderParentProvider>
    );
});
