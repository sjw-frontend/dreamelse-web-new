// @ts-nocheck
import { useEffect, useMemo } from 'react';
import { DramatizeEngineController } from '$/component-controllers';
import { useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { optimize } from '$/view';
import type { ScriptTypes } from '$/types';
import { ScriptController } from '$/controllers';
import { DramatizeLoading } from '$/components/dramatize-loading/dramatize-loading-ui';
import { DramatizeEngine } from '$/components/dramatize-engine/dramatize-engine-ui';
import { DramatizePanel } from '$/components/dramatize-panel/dramatize-panel-ui';
import { PlayScriptController } from './play-script-controller';

export const PlayScriptPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayScriptController);
    const [engineCtrl, EngineProvider] = useRegisterRenderController(DramatizeEngineController);

    // inject DramatizeEngineController — this triggers #start()
    useEffect(() => {
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

    const scriptCtrl = useZoneController(ScriptController);

    const loadingTextList = useReactive(() => ({
        list: scriptCtrl.state.waitNarrativeLoadingTextList,
    })).list;

    const roles = useMemo(
        () =>
            state.roles?.map((item: ScriptTypes.FrozenRoleInfo) => ({
                name: item.state.characterInfo?.state.name ?? '',
                avatar: item.state.characterInfo?.state.currentFigure?.visual ?? null,
                title: item.state.identities[0]?.label ?? '',
                description: item.state.backgroundDesc ?? '',
                secret: item.state.secret ?? '',
            })),
        [state.roles],
    );

    const speedLabel =
        state.speed === 1.5 ? '1.5x'
        : state.speed === 2 ? '2x'
        : state.speed === 0.75 ? '0.75x'
        : '1x';

    return (
        <RenderParentProvider>
            <EngineProvider>
                <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">

                    {/* ── Header ── */}
                    <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 flex flex-col gap-2">
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

                    {/* ── DramatizeEngine: Canvas + Audios + Front (captions, options) ── */}
                    <DramatizeEngine />

                    {/* ── DramatizeLoading (roles + default) ── */}
                    <DramatizeLoading
                        show={state.showLoading}
                        kind={state.showLoadingRoles ? 'roles' : 'default'}
                        showLottie={state.showLottie}
                        storyDesc={state.storyDesc}
                        roles={roles}
                        loadingTextList={loadingTextList}
                    />

                    {/* ── DramatizePanel（速度 + 回顾 + 章节列表） ── */}
                    {state.playId != null && (
                        <DramatizePanel
                            playId={state.playId}
                            speedEnabled
                            speed={state.speed}
                            chapterEnabled={state.isChapterDisplay}
                            reviewEnabled
                            showChapterList={state.showChapterList}
                            totalChapterCount={state.totalChapterCount}
                            onToggleListShow={ctrl.toggleChapterListShow}
                            onChangeSpeed={ctrl.onChangeSpeed}
                            onSelectChapter={ctrl.selectChapter}
                            onChapterListChange={ctrl.setChapterList}
                            onRestart={ctrl.restart}
                        />
                    )}
                </div>
            </EngineProvider>
        </RenderParentProvider>
    );
});
