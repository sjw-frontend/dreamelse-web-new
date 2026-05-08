// @ts-nocheck
import { useRef, useState } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { Pressable, ScrollView } from '$/uis/primitives';
import { CharacterDetailsController } from './character-details-controller';

export const CharacterDetailsPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterDetailsController);

    const state = useReactive(() => ({
        data: ctrl.state.data,
        dataState: ctrl.state.data && { ...ctrl.state.data.state },
        detailsPanelExpanded: ctrl.state.detailsPanelExpanded,
        showMoreMenu: ctrl.state.showMoreMenu,
    }));

    const [nameEditValue, setNameEditValue] = useState('');
    const [isNameEditing, setIsNameEditing] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const bgColor = state.dataState?.currentFigureSkin?.backgroundColor ?? null;
    const figureUri = state.dataState?.currentViewFigure?.visual?.uri ?? null;

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page relative overflow-hidden">
                {/* Gradient background */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: bgColor
                            ? `linear-gradient(to bottom, ${bgColor}99 0%, #1A1A1A 60%)`
                            : 'linear-gradient(to bottom, #2a2a2a 0%, #1A1A1A 60%)',
                    }}
                />

                {/* Character figure */}
                {figureUri && (
                    <div className="absolute inset-0 pointer-events-none flex items-start justify-center overflow-hidden">
                        <img
                            src={figureUri}
                            alt="character"
                            className="w-full object-contain opacity-80"
                            style={{ maxHeight: '70%' }}
                        />
                    </div>
                )}

                {/* Top bar */}
                <div className="relative z-10 flex flex-row items-center justify-between px-4 pt-4 pb-2 shrink-0">
                    <Pressable
                        onPress={ctrl.goBack}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Pressable>

                    {/* More menu button + dropdown */}
                    <div style={{ position: 'relative' }}>
                        <Pressable
                            onPress={ctrl.openMoreMenu}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="5" r="1.5" fill="white" />
                                <circle cx="12" cy="12" r="1.5" fill="white" />
                                <circle cx="12" cy="19" r="1.5" fill="white" />
                            </svg>
                        </Pressable>

                        {state.showMoreMenu && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 40,
                                    right: 0,
                                    zIndex: 50,
                                    backgroundColor: 'var(--color-bg-card, #2a2a2a)',
                                    borderRadius: 12,
                                    minWidth: 160,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <Pressable
                                    onPress={ctrl.togglePublic}
                                    className="w-full h-12 flex items-center px-4"
                                >
                                    <span className="text-text-primary font-medium text-sm">
                                        {state.dataState?.isPublic ? '设为私密' : '设为公开'}
                                    </span>
                                </Pressable>
                                <Pressable
                                    onPress={ctrl.closeMoreMenu}
                                    className="w-full h-12 flex items-center px-4"
                                >
                                    <span className="text-text-secondary font-medium text-sm">取消</span>
                                </Pressable>
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay to close more menu when clicking outside */}
                {state.showMoreMenu && (
                    <div
                        className="absolute inset-0 z-40"
                        onClick={ctrl.closeMoreMenu}
                    />
                )}

                {/* Details panel */}
                <div className="relative z-10 mt-auto">
                    <Pressable onPress={ctrl.toggleDetailsPanel} className="w-full">
                        <div className="flex items-center justify-center py-2">
                            <div className="w-8 h-1 rounded-full bg-white/30" />
                        </div>
                    </Pressable>

                    <div
                        className="bg-bg-card/90 backdrop-blur-md rounded-t-3xl overflow-hidden transition-all duration-300"
                        style={{ maxHeight: state.detailsPanelExpanded ? '70vh' : '180px' }}
                    >
                        <ScrollView className="flex-1">
                            <div className="px-5 pt-4 pb-8 flex flex-col gap-4">
                                {/* Name & honorary */}
                                <div className="flex flex-row items-start justify-between gap-3">
                                    <div className="flex flex-col gap-1">
                                        {isNameEditing ? (
                                            <input
                                                ref={nameInputRef}
                                                className="text-text-primary font-bold text-2xl bg-transparent border-b border-white/40 outline-none w-full"
                                                value={nameEditValue}
                                                maxLength={20}
                                                onChange={e => setNameEditValue(e.target.value)}
                                                onBlur={() => {
                                                    setIsNameEditing(false);
                                                    ctrl.setNameEdit(false);
                                                    ctrl.saveNameAndHonorary(nameEditValue, state.dataState?.honorary ?? '');
                                                }}
                                                autoFocus
                                            />
                                        ) : (
                                            <span
                                                className="text-text-primary font-bold text-2xl cursor-pointer"
                                                onClick={() => {
                                                    setNameEditValue(state.dataState?.name ?? '');
                                                    setIsNameEditing(true);
                                                    ctrl.setNameEdit(true);
                                                }}
                                            >
                                                {state.dataState?.name ?? '—'}
                                            </span>
                                        )}
                                        {state.dataState?.honorary && (
                                            <span className="text-text-secondary text-sm">
                                                {state.dataState.honorary}
                                            </span>
                                        )}
                                    </div>
                                    {state.dataState?.isPublic != null && (
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${state.dataState.isPublic ? 'bg-accent/20 text-accent' : 'bg-white/10 text-text-secondary'}`}>
                                            {state.dataState.isPublic ? '公开' : '私密'}
                                        </div>
                                    )}
                                </div>

                                {/* Bio */}
                                {state.dataState?.bio && (
                                    <p className="text-text-secondary text-sm leading-relaxed">
                                        {state.dataState.bio}
                                    </p>
                                )}

                                {/* Stats row */}
                                {state.dataState?.stats && (
                                    <div className="flex flex-row gap-3">
                                        <div className="flex-1 bg-white/5 rounded-2xl p-3 flex flex-col gap-1">
                                            <span className="text-text-secondary text-xs">能力值</span>
                                            <span className="text-text-primary font-bold text-xl">
                                                {state.dataState.stats.abilityValue ?? '—'}
                                            </span>
                                        </div>
                                        {state.dataState.stats.evaluation && (
                                            <div className="flex-1 bg-white/5 rounded-2xl p-3 flex flex-col gap-1">
                                                <span className="text-text-secondary text-xs">评价</span>
                                                <span className="text-text-primary font-semibold text-sm">
                                                    {state.dataState.stats.evaluation}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-row gap-3 pt-1">
                                    <Pressable
                                        onPress={ctrl.toStats}
                                        className="flex-1 h-12 rounded-2xl bg-accent flex items-center justify-center gap-2"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <path d="M3 15V9M7 15V5M11 15V7M15 15V3" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <span className="text-black font-semibold text-sm">数据</span>
                                    </Pressable>
                                    <Pressable
                                        onPress={ctrl.togglePublic}
                                        className="flex-1 h-12 rounded-2xl bg-white/10 flex items-center justify-center gap-2"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M9 3c0 0-3 2-3 6s3 6 3 6M9 3c0 0 3 2 3 6s-3 6-3 6M3 9h12" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        <span className="text-text-primary font-semibold text-sm">
                                            {state.dataState?.isPublic ? '设为私密' : '设为公开'}
                                        </span>
                                    </Pressable>
                                </div>
                            </div>
                        </ScrollView>
                    </div>
                </div>

            </div>
        </RenderParentProvider>
    );
});
