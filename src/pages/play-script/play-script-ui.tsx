// @ts-nocheck
import { useMemo } from 'react';
import { DramatizeEngineController } from '$/component-controllers';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import type { ScriptTypes } from '$/types';
import { DramatizeLoading } from '$/components/dramatize-loading/dramatize-loading-ui';
import { PlayScriptController } from './play-script-controller';

export const PlayScriptPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayScriptController);
    const [engineCtrl, EngineProvider] = useRegisterRenderController(DramatizeEngineController);

    // P0 fix: inject DramatizeEngineController — this triggers #start()
    useMemo(() => {
        console.log('[PlayScript] setRelatedControllers called');
        ctrl.setRelatedControllers({ dramatizeEngineCtrl: engineCtrl });
    }, []);

    const state = useReactive(() => ({
        title: ctrl.state.title,
        showLoading: ctrl.state.showLoading,
        showLottie: ctrl.state.showLottie,
        showLoadingRoles: ctrl.state.showLoadingRoles,
        goal: ctrl.state.goal,
        showGoal: ctrl.state.showGoal,
        storyDesc: ctrl.state.storyDesc,
        roles: ctrl.state.roles,
        playId: ctrl.state.playId,
        totalChapterCount: ctrl.state.totalChapterCount,
        isChapterDisplay: ctrl.state.isChapterDisplay,
        showChapterList: ctrl.state.showChapterList,
        speed: ctrl.state.speed,
        isInteractionShow: ctrl.state.isInteractionShow,
    }));

    const engineState = useReactive(() => ({
        narrative: engineCtrl.state.narrative,
        isLoading: engineCtrl.state.isLoading,
        isWaitFirst: engineCtrl.state.isWaitFirst,
        isInteractionShow: engineCtrl.state.isInteractionShow,
        isWorldLineEnd: engineCtrl.state.isWorldLineEnd,
    }));

    const roles = useMemo(
        () =>
            state.roles?.map((item: ScriptTypes.FrozenRoleInfo) => ({
                name: item.state.characterInfo?.state.name ?? '',
                avatarUri: item.state.characterInfo?.state.currentFigure?.visual?.uri ?? null,
                title: item.state.identities[0]?.label ?? '',
            })),
        [state.roles],
    );

    const speedLabel =
        state.speed === 1.5 ? '1.5x'
        : state.speed === 2 ? '2x'
        : state.speed === 0.75 ? '0.75x'
        : '1x';

    // Current narrative data for display
    const narrative = engineState.narrative;
    const narrativeState = narrative?.state;

    return (
        <RenderParentProvider>
            <EngineProvider>
                <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">

                    {/* ── Header ── */}
                    <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <h1 className="flex-1 text-xl font-bold text-text-primary truncate">
                                {state.title}
                            </h1>
                            <button
                                type="button"
                                onClick={ctrl.handleBack}
                                className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
                                aria-label="关闭"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Goal badge */}
                        {state.showGoal && state.goal && (
                            <div className="self-start flex items-center gap-1.5 h-[26px] px-2 rounded-lg bg-white/15 backdrop-blur-sm max-w-full overflow-hidden">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ABFF1A" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="4" />
                                </svg>
                                <span className="text-sm font-medium text-text-primary truncate">
                                    目标：{state.goal}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Top gradient ── */}
                    <div
                        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
                        style={{
                            height: 120,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.25), rgba(0,0,0,0))',
                        }}
                    />

                    {/* ── Bottom gradient ── */}
                    <div
                        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                        style={{
                            height: 260,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6) 50%, rgba(0,0,0,1))',
                        }}
                    />

                    {/* ── Main content area ── */}
                    <div className="absolute inset-0 flex flex-col justify-end pb-24">

                        {/* Captions — role name + dialogue text */}
                        {narrativeState && !engineState.isLoading && !engineState.isInteractionShow && (
                            <div className="px-6 py-3 z-20">
                                {narrativeState.roleName && (
                                    <div className="flex items-center h-[34px] mb-1">
                                        <span
                                            className="font-extrabold text-text-primary"
                                            style={{
                                                fontSize: 24,
                                                borderBottom: '1px solid rgba(255,255,255,0.5)',
                                                paddingBottom: 2,
                                            }}
                                        >
                                            {narrativeState.roleName}
                                        </span>
                                    </div>
                                )}
                                <p
                                    className="text-text-primary"
                                    style={{
                                        fontSize: narrativeState.isNarrator ? 24 : 20,
                                        fontWeight: narrativeState.isNarrator ? 900 : 600,
                                        lineHeight: '1.4',
                                    }}
                                >
                                    {narrativeState.text}
                                </p>
                            </div>
                        )}

                        {/* Interaction options */}
                        {engineState.isInteractionShow && narrativeState?.interaction && (
                            <div className="px-4 pb-4 z-20 flex flex-col gap-2">
                                {narrativeState.interaction.options?.map((opt: any, i: number) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="w-full py-3 px-4 rounded-2xl text-left text-text-primary font-semibold"
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.12)',
                                            fontSize: 16,
                                            backdropFilter: 'blur(8px)',
                                        }}
                                        onClick={() => engineCtrl.interact(narrativeState.narrativeId, opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── DramatizeLoading (roles + default) ── */}
                    <DramatizeLoading
                        show={state.showLoading}
                        kind={state.showLoadingRoles ? 'roles' : 'default'}
                        showLottie={state.showLottie}
                        storyDesc={state.storyDesc}
                        roles={roles}
                    />

                    {/* ── Bottom panel: speed + chapter ── */}
                    {state.playId != null && !state.showLoadingRoles && (
                        <div
                            className={cn(
                                'absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-4',
                                !state.isChapterDisplay && 'opacity-0 pointer-events-none',
                            )}
                        >
                            <button
                                type="button"
                                onClick={ctrl.toggleChapterListShow}
                                className="h-10 px-4 rounded-full text-white text-sm font-semibold flex items-center gap-2"
                                style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                                第 {state.totalChapterCount} 章
                            </button>

                            <button
                                type="button"
                                onClick={ctrl.onChangeSpeed}
                                className="h-10 px-4 rounded-full text-white text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                            >
                                {speedLabel}
                            </button>
                        </div>
                    )}

                    {/* ── Chapter list overlay ── */}
                    {state.showChapterList && (
                        <div
                            className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-end"
                            onClick={ctrl.toggleChapterListShow}
                        >
                            <div
                                className="w-full bg-bg-card rounded-t-2xl p-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-bold text-text-primary">章节列表</span>
                                    <button
                                        type="button"
                                        onClick={ctrl.toggleChapterListShow}
                                        className="text-text-secondary hover:text-text-primary"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-text-secondary text-sm">共 {state.totalChapterCount} 章</p>
                            </div>
                        </div>
                    )}
                </div>
            </EngineProvider>
        </RenderParentProvider>
    );
});
